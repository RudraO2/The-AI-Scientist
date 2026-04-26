"""FastAPI app — orchestrates parse → QC → recall → generate → store; plus feedback ingest."""
from __future__ import annotations
import os
import uuid
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from schemas import (
    GeneratePlanRequest, GeneratePlanResponse,
    FeedbackRequest, FeedbackResponse,
    LiteratureQCResult, ParsedHypothesis, ExperimentPlan, AppliedCorrection,
    ParseQcResponse, RecalledCorrectionSummary,
    LineageEntry, HistoryItem, Domain,
)
import re
from difflib import SequenceMatcher
from gemini_client import GeminiClient
from hydra_client import HydraClient
from literature import run_literature_qc
import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm clients and HydraDB tenant so first user request is fast.
    app.state.gemini = GeminiClient()
    app.state.hydra = HydraClient()
    await asyncio.to_thread(db.init_db)
    try:
        await asyncio.to_thread(app.state.hydra.ensure_tenant)
    except Exception as e:
        print(f"[startup] HydraDB tenant warmup failed: {e}")
    yield


app = FastAPI(title="The AI Scientist", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


# ---------- Stage 1+2: parse + literature QC + recall ----------

_SECTION_HINT_RE = re.compile(r"\[section:([a-z]+)\]")


def _summarize_recall(corrections: list[dict]) -> list[RecalledCorrectionSummary]:
    out: list[RecalledCorrectionSummary] = []
    for c in corrections:
        text = c.get("text", "")
        m = _SECTION_HINT_RE.search(text)
        out.append(RecalledCorrectionSummary(
            text=text[:200],
            score=float(c.get("score", 0.0)),
            section_hint=m.group(1) if m else None,
        ))
    return out


@app.post("/api/parse_qc", response_model=ParseQcResponse)
async def parse_qc(req: GeneratePlanRequest):
    gemini: GeminiClient = app.state.gemini
    hydra: HydraClient = app.state.hydra

    try:
        parsed = await asyncio.to_thread(gemini.parse_hypothesis, req.hypothesis)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Hypothesis parse failed: {e}") from e

    qc_task = asyncio.create_task(
        run_literature_qc(hypothesis=req.hypothesis, keywords=parsed.keywords)
    )
    corrections_task = asyncio.create_task(
        asyncio.to_thread(
            hydra.recall_corrections,
            query=req.hypothesis, domain=parsed.domain, top_k=5,
        )
    )
    qc_result, corrections = await asyncio.gather(qc_task, corrections_task)

    plan_id = uuid.uuid4().hex[:8]
    await asyncio.to_thread(
        db.insert_partial_plan,
        plan_id=plan_id,
        hypothesis=req.hypothesis,
        domain=parsed.domain,
        parsed=parsed.model_dump(),
        qc=qc_result.model_dump(),
    )

    return ParseQcResponse(
        plan_id=plan_id,
        parsed=parsed,
        qc=qc_result,
        recalled_corrections=_summarize_recall(corrections),
    )


# ---------- Stage 3: idempotent plan generation ----------

@app.post("/api/plan/{plan_id}/generate", response_model=GeneratePlanResponse)
async def generate_plan(plan_id: str):
    gemini: GeminiClient = app.state.gemini
    hydra: HydraClient = app.state.hydra

    rec = await asyncio.to_thread(db.get_plan, plan_id)
    if not rec:
        raise HTTPException(404, "Plan not found")

    parsed = ParsedHypothesis.model_validate(rec["parsed"])
    qc_result = LiteratureQCResult.model_validate(rec["qc"])

    # Idempotent short-circuit: plan already generated.
    if rec["plan_payload"] is not None:
        return GeneratePlanResponse(
            plan_id=plan_id, parsed=parsed, qc=qc_result,
            plan=ExperimentPlan.model_validate(rec["plan_payload"]),
        )

    corrections = await asyncio.to_thread(
        hydra.recall_corrections,
        query=rec["hypothesis"], domain=parsed.domain, top_k=5,
    )

    qc_summary = (
        f"Novelty: {qc_result.novelty}. {qc_result.rationale} "
        f"({len(qc_result.references)} references found.)"
    )

    try:
        plan = await asyncio.to_thread(
            gemini.generate_plan,
            hypothesis=rec["hypothesis"],
            parsed=parsed,
            qc_summary=qc_summary,
            corrections=corrections,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Plan generation failed: {e}") from e

    if not plan.applied_corrections and corrections:
        plan.applied_corrections = [
            AppliedCorrection(
                correction_text=c["text"][:400],
                relevance_score=c["score"],
                applied_to_section="protocol",
            )
            for c in corrections[:2]
        ]

    # Resolve each applied correction to its source row + write `applied` lineage rows.
    await _resolve_and_record_applied(plan_id, plan, corrections)

    await asyncio.to_thread(db.set_plan_payload, plan_id, plan.model_dump())

    return GeneratePlanResponse(plan_id=plan_id, parsed=parsed, qc=qc_result, plan=plan)


async def _resolve_and_record_applied(plan_id: str, plan: ExperimentPlan,
                                      recalled: list[dict]) -> None:
    """Match Gemini-emitted applied_corrections against the recall set, look up source rows,
    populate correction_id + source_plan_id on the plan payload, and insert lineage rows."""
    if not plan.applied_corrections or not recalled:
        return
    for ac in plan.applied_corrections:
        best = None
        best_ratio = 0.0
        for c in recalled:
            ratio = SequenceMatcher(None, ac.correction_text, c["text"]).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best = c
        if not best or best_ratio < 0.8:
            continue
        row = await asyncio.to_thread(db.get_correction_by_hydra_id, best["source_id"])
        if not row:
            continue
        ac.correction_id = row["id"]
        ac.source_plan_id = row["plan_id"]
        await asyncio.to_thread(
            db.insert_applied, plan_id, row["id"], ac.applied_to_section,
        )


@app.get("/api/plan/{plan_id}", response_model=GeneratePlanResponse)
async def get_plan(plan_id: str):
    rec = await asyncio.to_thread(db.get_plan, plan_id)
    if not rec:
        raise HTTPException(404, "Plan not found")
    if rec["plan_payload"] is None:
        raise HTTPException(404, "Plan generation not yet complete")
    return GeneratePlanResponse(
        plan_id=plan_id,
        parsed=ParsedHypothesis.model_validate(rec["parsed"]),
        qc=LiteratureQCResult.model_validate(rec["qc"]),
        plan=ExperimentPlan.model_validate(rec["plan_payload"]),
    )


@app.get("/api/plan/{plan_id}/qc", response_model=ParseQcResponse)
async def get_plan_qc(plan_id: str):
    """Returns the parse + QC view for a plan, even when the plan_payload is still null.

    Re-recalls Hydra corrections at fetch time. Cheap (~1s) and avoids stashing recall
    results in SQLite.
    """
    hydra: HydraClient = app.state.hydra
    rec = await asyncio.to_thread(db.get_plan, plan_id)
    if not rec:
        raise HTTPException(404, "Plan not found")
    parsed = ParsedHypothesis.model_validate(rec["parsed"])
    qc_result = LiteratureQCResult.model_validate(rec["qc"])
    corrections = await asyncio.to_thread(
        hydra.recall_corrections,
        query=rec["hypothesis"], domain=parsed.domain, top_k=5,
    )
    return ParseQcResponse(
        plan_id=plan_id, parsed=parsed, qc=qc_result,
        recalled_corrections=_summarize_recall(corrections),
    )


@app.get("/api/plan/{plan_id}/lineage", response_model=list[LineageEntry])
async def get_lineage(plan_id: str):
    rec = await asyncio.to_thread(db.get_plan, plan_id)
    if not rec:
        raise HTTPException(404, "Plan not found")
    rows = await asyncio.to_thread(db.get_lineage, plan_id)
    out: list[LineageEntry] = []
    for r in rows:
        out.append(LineageEntry(
            correction_id=r["id"],
            section=r["section"],
            applied_section=r["applied_section"],
            before_text=r["before_text"],
            after_text=r["after_text"],
            rating=r["rating"],
            annotation=r["annotation"],
            rationale=r["rationale"],
            source_plan_id=r["plan_id"],
            source_domain=r.get("source_domain"),
            source_created_at=r.get("source_created_at"),
        ))
    return out


@app.get("/api/history", response_model=list[HistoryItem])
async def get_history(domain: Domain | None = None, limit: int = 100):
    rows = await asyncio.to_thread(db.get_history, domain, limit)
    out: list[HistoryItem] = []
    for r in rows:
        out.append(HistoryItem(
            correction_id=r["id"],
            plan_id=r["plan_id"],
            section=r["section"],
            domain=r["domain"],
            before_text=r["before_text"],
            after_text=r["after_text"],
            rating=r["rating"],
            annotation=r["annotation"],
            rationale=r["rationale"],
            created_at=r["created_at"],
            applied_count=r["applied_count"],
        ))
    return out


# ---------- Feedback / corrections ----------

@app.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest):
    hydra: HydraClient = app.state.hydra

    try:
        memory_id: str | None = await asyncio.to_thread(
            hydra.ingest_correction,
            domain=req.domain,
            section=req.section,
            before_text=req.before_text,
            after_text=req.after_text,
            rationale=req.rationale,
            rating=req.rating,
            annotation=req.annotation,
        )
    except Exception as e:
        memory_id = None
        print(f"[feedback] HydraDB ingest failed, persisting locally only: {e}")

    correction_id = await asyncio.to_thread(
        db.insert_correction,
        plan_id=req.plan_id,
        section=req.section,
        before_text=req.before_text,
        after_text=req.after_text,
        rating=req.rating,
        annotation=req.annotation,
        rationale=req.rationale,
        hydra_memory_id=memory_id,
        domain=req.domain,
    )

    return FeedbackResponse(
        success=memory_id is not None,
        memory_id=memory_id or "",
        correction_id=correction_id,
        message=(
            "Correction stored. Future plans for similar experiments will incorporate it."
            if memory_id else
            "Stored locally; semantic recall delayed."
        ),
    )


# ---------- List recalled corrections (debug / transparency) ----------

class RecallQuery(BaseModel):
    query: str
    domain: str | None = None
    top_k: int = 5


@app.post("/api/recall")
async def recall(q: RecallQuery):
    hydra: HydraClient = app.state.hydra
    hits = await asyncio.to_thread(
        hydra.recall_corrections, query=q.query, domain=q.domain, top_k=q.top_k,
    )
    return {"hits": hits, "count": len(hits)}
