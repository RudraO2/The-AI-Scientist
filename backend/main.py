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
)
from gemini_client import GeminiClient
from hydra_client import HydraClient
from literature import run_literature_qc


# In-memory plan store for the hackathon. Maps plan_id -> {parsed, qc, plan, hypothesis, domain}.
PLANS: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm clients and HydraDB tenant so first user request is fast.
    app.state.gemini = GeminiClient()
    app.state.hydra = HydraClient()
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


# ---------- Stage 1+2+3 combined endpoint (simplest UX) ----------

@app.post("/api/generate", response_model=GeneratePlanResponse)
async def generate(req: GeneratePlanRequest):
    gemini: GeminiClient = app.state.gemini
    hydra: HydraClient = app.state.hydra

    # Stage 1: parse
    try:
        parsed = await asyncio.to_thread(gemini.parse_hypothesis, req.hypothesis)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Hypothesis parse failed: {e}") from e

    # Stage 2: literature QC + Stage 2.5: pull past corrections in parallel
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

    qc_summary = (
        f"Novelty: {qc_result.novelty}. {qc_result.rationale} "
        f"({len(qc_result.references)} references found.)"
    )

    # Stage 3: generate plan
    try:
        plan = await asyncio.to_thread(
            gemini.generate_plan,
            hypothesis=req.hypothesis,
            parsed=parsed,
            qc_summary=qc_summary,
            corrections=corrections,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Plan generation failed: {e}") from e

    # Auto-fill applied_corrections if Gemini returned them empty but corrections existed.
    if not plan.applied_corrections and corrections:
        plan.applied_corrections = [
            AppliedCorrection(
                correction_text=c["text"][:400],
                relevance_score=c["score"],
                applied_to_section="protocol",
            )
            for c in corrections[:2]
        ]

    plan_id = str(uuid.uuid4())[:8]
    PLANS[plan_id] = {
        "hypothesis": req.hypothesis,
        "parsed": parsed.model_dump(),
        "qc": qc_result.model_dump(),
        "plan": plan.model_dump(),
        "domain": parsed.domain,
    }

    return GeneratePlanResponse(plan_id=plan_id, parsed=parsed, qc=qc_result, plan=plan)


@app.get("/api/plan/{plan_id}", response_model=GeneratePlanResponse)
async def get_plan(plan_id: str):
    rec = PLANS.get(plan_id)
    if not rec:
        raise HTTPException(404, "Plan not found")
    return GeneratePlanResponse(
        plan_id=plan_id,
        parsed=ParsedHypothesis.model_validate(rec["parsed"]),
        qc=LiteratureQCResult.model_validate(rec["qc"]),
        plan=ExperimentPlan.model_validate(rec["plan"]),
    )


# ---------- Feedback / corrections ----------

@app.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest):
    hydra: HydraClient = app.state.hydra
    try:
        memory_id = await asyncio.to_thread(
            hydra.ingest_correction,
            domain=req.domain,
            section=req.section,
            before_text=req.before_text,
            after_text=req.after_text,
            rationale=req.rationale,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HydraDB ingest failed: {e}") from e

    return FeedbackResponse(
        success=True,
        memory_id=memory_id,
        message="Correction stored. Future plans for similar experiments will incorporate it.",
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
