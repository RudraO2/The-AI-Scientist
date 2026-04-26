# Architecture — Backend

## Executive Summary

The backend is a single-process FastAPI service that orchestrates one synchronous user journey: hypothesis → parsed structure → literature QC + memory recall → generated experiment plan. State is held entirely in memory (`PLANS: dict[str, dict]` in `main.py`) — there is no database. Three external services are touched: Google Gemini (LLM), HydraDB (correction memory), and a literature pair (Semantic Scholar Graph API + arXiv Atom feed).

The architectural shape is deliberately thin: clients are wrapped in small classes with a single responsibility each, all sync SDK calls are pushed onto threads via `asyncio.to_thread`, and parallelizable I/O (literature QC + memory recall) runs through `asyncio.gather`. There is no service layer, no DI container, no repository pattern — module-level instantiation in `lifespan` is the seam.

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Language | Python | 3.13 | Latest stable with full async support |
| Web framework | FastAPI | 0.115.6 | Async-native, Pydantic-integrated, OpenAPI for free |
| ASGI server | uvicorn[standard] | 0.32.1 | Reload + websockets-ready (unused) |
| Validation | pydantic | ≥2.11.7 | v2 — drives Gemini structured output and request/response schemas |
| HTTP client | httpx | 0.28.1 | Async client used in `literature.py` |
| LLM SDK | google-genai | 1.27.0 | New unified SDK; supports `response_schema=PydanticModel` |
| Memory SDK | hydra-db-python | 0.1.6 | Tenant lifecycle, `upload.add_memory`, `recall.recall_preferences` |
| Env | python-dotenv | 1.0.1 | Load `.env` at process start |

## Architecture Pattern

**Async-orchestrating REST service.** No layers, no domain modelling — flat module structure where each file is a single responsibility:

- `main.py` — HTTP surface, orchestration, in-memory store
- `gemini_client.py` — LLM wrapper (parse + generate)
- `hydra_client.py` — memory ops (ingest + recall + tenant lifecycle)
- `literature.py` — pure async functions for external lit search + scoring
- `prompts.py` — string constants only (no logic)
- `schemas.py` — all Pydantic models (public API + internal)

Two routes (`/api/generate`, `/api/plan/{id}`) follow a request → orchestrate → response shape. One write route (`/api/feedback`) is fire-and-forget into HydraDB. The orchestration in `generate()` is the heart of the system — see [Integration Architecture](./integration-architecture.md).

## Module Map

### `main.py` — HTTP surface + orchestration

- **Lifespan** instantiates `GeminiClient` and `HydraClient`, attaches to `app.state`. Warms HydraDB tenant on `to_thread` so first request is fast. Tenant warmup failure is caught and logged — startup never blocks.
- **CORS** middleware reads `CORS_ORIGINS` env, defaults to `http://localhost:3000`. Allows credentials, all methods, all headers.
- **`POST /api/generate`** — full pipeline: parse → (qc ‖ recall) → generate → store → return. Failures in parse or generate raise `HTTPException(502)` with detail.
- **`GET /api/plan/{plan_id}`** — fetches from `PLANS`. Returns 404 if missing (i.e. after restart). Re-validates payload via Pydantic on the way out.
- **`POST /api/feedback`** — calls `hydra.ingest_correction`. Returns the HydraDB `source_id` and a confirmation message. 502 on ingest failure.
- **`POST /api/recall`** — debug/transparency endpoint, takes free-text query + optional domain, returns top-k recalled chunks.
- **`GET /health`** — liveness only.

### `gemini_client.py` — `GeminiClient`

- Init reads `GEMINI_API_KEY` (required) and optional `GEMINI_MODEL` (default `gemini-3-flash-preview` — pro is rate-limited on free tier).
- `parse_hypothesis(hypothesis: str) -> ParsedHypothesis` — uses `system_instruction=PARSE_HYPOTHESIS_SYSTEM`, `response_mime_type="application/json"`, `response_schema=ParsedHypothesis`, `temperature=0.2`.
- `generate_plan(*, hypothesis, parsed, qc_summary, corrections)` — formats the user prompt via `GENERATE_PLAN_USER_TEMPLATE` (with optional `CORRECTIONS_BLOCK_TEMPLATE`), calls Gemini with `response_schema=ExperimentPlan`, `temperature=0.4`, `max_output_tokens=16384`.
- Returns Pydantic-validated objects; throws on schema mismatch.

### `hydra_client.py` — `HydraClient`

- Init reads `HYDRADB_API_KEY` (required), `HYDRA_TENANT_ID` (default `ai-scientist`), `HYDRA_SUB_TENANT_ID` (default `default`). The actual prod tenant in use is `ai-scientist-test` (see `.env.example`).
- `ensure_tenant(max_wait_seconds)` — module-level `_TENANT_READY` cache. Calls `tenant.create` (idempotent — swallows existing-tenant exceptions), then polls `tenant.get_infra_status` every 2s until all `vectorstore_status` flags are true. Raises `TimeoutError` on deadline.
- `ingest_correction(...)` — formats body with `[domain:X] [section:Y]` tag prefix, posts via `upload.add_memory(memories=[{text, infer:True}], upsert=True)`. Returns `source_id`. Raises on failure (we want loud failures here — silent drops defeat the feedback loop).
- `recall_corrections(query, domain, top_k)` — soft-fails with `[]` if tenant not ready or recall errors. Builds weighted query (`[domain:X] {query}`) and calls `recall.recall_preferences` (NOT `full_recall` — that returned 0 chunks in our smoke tests). Returns list of `{text, score, source_id}`.
- `_format_correction_body` — static helper, truncates each field to 400 chars to bound memory token usage.

### `literature.py` — pure async functions

- `search_semantic_scholar(query, limit)` — GET `https://api.semanticscholar.org/graph/v1/paper/search` with optional `x-api-key` header. 12s timeout. Returns `[]` on any error. Maps to `LiteratureRef`.
- `search_arxiv(query, limit)` — GET arXiv Atom feed, parses XML via `xml.etree.ElementTree`. 12s timeout. Returns `[]` on any error.
- `_score_overlap(text, keywords)` — fraction of `keywords` present in `text.lower()`.
- `run_literature_qc(*, hypothesis, keywords)` — runs both searches in parallel via `asyncio.gather`, scores all candidates, takes top-3, applies novelty heuristic:
  - top score `< 0.20` → `not_found`
  - top score `≥ 0.85` → `exact_match_found`
  - otherwise → `similar_work_exists`
  - The 0.85 ceiling means with the current keyword extraction we will rarely emit `exact_match_found`. That's expected — we want false-negatives over false-positives in a hackathon demo.

### `prompts.py` — Gemini prompt text

- `PARSE_HYPOTHESIS_SYSTEM` — instructs decomposition into the seven `ParsedHypothesis` fields.
- `GENERATE_PLAN_SYSTEM` — defines the senior-CRO-scientist persona. Lists 6 plan sections, demands real catalog numbers (with explicit "say 'supplier item' rather than fabricate" rule), realistic costs (±50% of 2026 market price), feasible timelines, and silent application of past corrections.
- `GENERATE_PLAN_USER_TEMPLATE` — template with `{hypothesis}`, `{parsed_json}`, `{qc_summary}`, `{corrections_block}` slots.
- `CORRECTIONS_BLOCK_TEMPLATE` — wraps recalled corrections, instructs model to populate `applied_corrections` when used.

### `schemas.py` — Pydantic v2 models

See [Data Models](./data-models.md) for the full model reference. Key shapes:

- `Domain` literal — five values (`diagnostics | gut_health | cell_biology | climate | other`)
- `ParsedHypothesis` — 7 fields, drives plan generation prompt
- `LiteratureQCResult` — `novelty: NoveltySignal` + `rationale` + max 3 `LiteratureRef`
- `ExperimentPlan` — protocol[], materials[], total_budget_usd, timeline[], validation[], risks_and_mitigations[], applied_corrections[]
- `GeneratePlanRequest` — single `hypothesis: str` with `min_length=20, max_length=2000`
- `FeedbackRequest` — `plan_id, domain, section, before_text, after_text, rationale`

## Data Architecture

**No database.** Plans live in `PLANS: dict[str, dict]` in `main.py`. Backend restart wipes all plans. The frontend's `/plan/[id]` route returns a 404-style "Plan not found" view when `PLANS.get(id)` is `None` — see `frontend/app/plan/[id]/page.tsx`.

**Memory store** is HydraDB (single tenant `ai-scientist-test`, sub-tenant `default`). Corrections are stored as plain text bodies with structured tags prefixed (`[domain:X] [section:Y]`). Free-tier limits: 2 tenants max, 100k tokens ingest. We rely on semantic search over the body to recover corrections.

## API Design

See [API Contracts — Backend](./api-contracts-backend.md) for the full contract.

## Configuration

| Env var | Default | Required | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | — | yes | Google AI Studio key |
| `GEMINI_MODEL` | `gemini-3-flash-preview` | no | Model id; avoid `gemini-pro` (rate-limited on free tier) |
| `HYDRADB_API_KEY` | — | yes | HydraDB token |
| `HYDRA_TENANT_ID` | `ai-scientist` | no | Override to `ai-scientist-test` per `.env.example` |
| `HYDRA_SUB_TENANT_ID` | `default` | no | Sub-tenant scope |
| `SEMANTIC_SCHOLAR_API_KEY` | empty | no | Optional; Semantic Scholar works keyless but rate-limited |
| `CORS_ORIGINS` | `http://localhost:3000` | no | Comma-separated allowed origins |

## Concurrency & Performance

- All sync SDK work (Gemini, HydraDB) is dispatched via `asyncio.to_thread`. The event loop stays free.
- The two slow paths inside `generate()` — literature QC and corrections recall — fire concurrently via `asyncio.gather`. Saves ~2s on the cold path.
- Plan generation (`gemini.generate_plan`) is the dominant cost (~17s). It is not parallelizable with itself — it depends on the parsed hypothesis and QC summary. There is no streaming today — the client sees a spinner for the full call.
- Literature timeouts are 12s each; if both fail the QC silently degrades to "no references" without failing the request.

## Error Handling

- Parse failure → 502 with detail "Hypothesis parse failed: {e}".
- Plan generation failure → 502 with detail "Plan generation failed: {e}".
- Feedback ingest failure → 502 with detail "HydraDB ingest failed: {e}".
- Plan fetch on missing id → 404 "Plan not found".
- HydraDB recall failure → soft-fails to `[]`. The plan still generates without applied corrections.
- Literature search failure → soft-fails to `[]`. Novelty falls through to `not_found`.

The pattern is: writes fail loud, reads fail soft. This protects the user-visible flow while still surfacing real problems.

## Testing Strategy

None present in repo. Hackathon scope.

## Deployment

Local only. `uvicorn main:app --reload --port 8000`. No Dockerfile, no CI/CD. See [Development Guide](./development-guide.md) for details.
