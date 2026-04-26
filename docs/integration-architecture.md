# Integration Architecture

## Repository Type

Multi-part monorepo with two parts and one HTTP boundary. No shared workspace tooling, no monorepo manager (Turborepo, Nx, pnpm workspaces) — each part is a self-contained app launched independently.

## Parts

| Part ID | Path | Type | Tech |
|---|---|---|---|
| backend | `backend/` | Python REST service | FastAPI 0.115, Pydantic v2, httpx |
| frontend | `frontend/` | Next.js web app | Next.js 15, React 19, Tailwind 3 |

## Integration Points

### 1. Frontend → Backend (HTTP / JSON)

The single integration boundary in this repo. Frontend speaks REST/JSON to the backend.

| Detail | Value |
|---|---|
| Protocol | HTTP/1.1 |
| Auth | none |
| Content type | `application/json` |
| Origin (dev) | `http://localhost:3000` |
| Target (dev) | `http://localhost:8000` |
| Frontend env | `NEXT_PUBLIC_API_URL` |
| Backend CORS env | `CORS_ORIGINS` |
| Cache policy | `cache: "no-store"` on every request |

#### Endpoints used by frontend

| Direction | Method + Path | Frontend caller | Trigger |
|---|---|---|---|
| FE → BE | `POST /api/generate` | `generatePlan(hypothesis)` in `lib/api.ts:19` | User submits `<HypothesisForm>` |
| FE → BE | `GET /api/plan/{id}` | `getPlan(planId)` in `lib/api.ts:26` | `app/plan/[id]/page.tsx` server-renders |
| FE → BE | `POST /api/feedback` | `submitFeedback(payload)` in `lib/api.ts:31` | User submits `<CorrectionDialog>` |

`POST /api/recall` and `GET /health` are **not** called by the frontend; they exist for debugging/transparency and uptime checks.

#### Error contract

Backend returns `{detail: string}` with non-200 status. Frontend `request<T>` wrapper attempts `j.detail || JSON.stringify(j)`, falls back to `${status} ${statusText}`, and throws an `Error`. UI surfaces via `toast.error(...)`.

### 2. Backend → Gemini (HTTPS via SDK)

| Detail | Value |
|---|---|
| SDK | `google-genai==1.27.0` |
| Auth | API key in `GEMINI_API_KEY` |
| Model | `gemini-3-flash-preview` (avoid `gemini-pro` — rate-limited on free tier) |
| Calls | `parse_hypothesis` (1 call/request), `generate_plan` (1 call/request) |
| Output mode | structured JSON via `response_schema=PydanticModel` |

Both calls are blocking and dispatched via `asyncio.to_thread` from `main.py`.

### 3. Backend → HydraDB (HTTPS via SDK)

| Detail | Value |
|---|---|
| SDK | `hydra-db-python==0.1.6` |
| Auth | API key in `HYDRADB_API_KEY` |
| Tenant | `ai-scientist-test` (free tier limit: 2 tenants max, 100k tokens ingest) |
| Sub-tenant | `default` |
| Ingest | `client.upload.add_memory(memories=[{text, infer:True}], upsert=True)` |
| Recall | `client.recall.recall_preferences(query, tenant_id, sub_tenant_id)` — NOT `full_recall` (returned 0 chunks in smoke test) |
| Tenant warmup | `tenant.create` (idempotent) + poll `tenant.get_infra_status` until all `vectorstore_status` flags true |

Tagging convention: each correction body is prefixed with `[domain:X] [section:Y]` followed by `Original: {before} | Corrected to: {after} | Reason: {rationale}`. Recall queries are weighted: `[domain:X] {user_query}`.

### 4. Backend → Semantic Scholar (HTTPS, httpx)

| Detail | Value |
|---|---|
| Endpoint | `https://api.semanticscholar.org/graph/v1/paper/search` |
| Auth | optional `x-api-key` from `SEMANTIC_SCHOLAR_API_KEY` (works keyless but rate-limited) |
| Timeout | 12s |
| Failure mode | returns `[]` — soft fail |

### 5. Backend → arXiv (HTTPS, httpx)

| Detail | Value |
|---|---|
| Endpoint | `http://export.arxiv.org/api/query` |
| Auth | none |
| Format | Atom XML, parsed via `xml.etree.ElementTree` |
| Timeout | 12s |
| Failure mode | returns `[]` — soft fail |

## Sequence — `POST /api/generate` (the hot path)

```
Frontend                Backend                 Gemini       Sem.Scholar   arXiv         HydraDB
   │  POST /generate       │                       │             │           │              │
   ├──────────────────────►│                       │             │           │              │
   │                       │ parse_hypothesis      │             │           │              │
   │                       ├──────────────────────►│             │           │              │
   │                       │   ParsedHypothesis    │             │           │              │
   │                       │◄──────────────────────┤             │           │              │
   │                       │                                                                │
   │                       │  ┌── asyncio.gather ──┐                                        │
   │                       │  │  search_semantic   │                                        │
   │                       │  │  ────────────────► │                                        │
   │                       │  │  search_arxiv      ├──────────────────────► │              │
   │                       │  │  recall_corrections├──────────────────────────────────────►│
   │                       │  └────────────────────┘                                        │
   │                       │                                                                │
   │                       │  generate_plan (with corrections in prompt)                    │
   │                       ├──────────────────────►│                                        │
   │                       │   ExperimentPlan      │                                        │
   │                       │◄──────────────────────┤                                        │
   │                       │                                                                │
   │                       │ store in PLANS dict, generate uuid plan_id                     │
   │  GeneratePlanResponse │                                                                │
   │◄──────────────────────┤                                                                │
```

## Sequence — `POST /api/feedback`

```
Frontend                  Backend                       HydraDB
   │  POST /feedback         │                             │
   ├────────────────────────►│                             │
   │                         │ ensure_tenant (120s budget) │
   │                         ├────────────────────────────►│
   │                         │ add_memory (tagged body)    │
   │                         ├────────────────────────────►│
   │                         │  source_id                  │
   │                         │◄────────────────────────────┤
   │  {success, memory_id}   │                             │
   │◄────────────────────────┤                             │
```

## Type Contract Mirroring

The backend Pydantic schema in `backend/schemas.py` is mirrored manually as TypeScript interfaces in `frontend/lib/types.ts`. There is no codegen.

**Drift risk:** every API contract change requires two coordinated edits.

| Backend (Pydantic) | Frontend (TS) | Notes |
|---|---|---|
| `Domain` Literal | `Domain` union | 5 values |
| `NoveltySignal` Literal | `NoveltySignal` union | 3 values |
| `ParsedHypothesis` | `ParsedHypothesis` | exact mirror |
| `LiteratureRef` | `LiteratureRef` | exact mirror |
| `LiteratureQCResult` | `LiteratureQCResult` | exact mirror |
| `Material` | `Material` | exact mirror |
| `ProtocolStep` | `ProtocolStep` | exact mirror |
| `TimelinePhase` | `TimelinePhase` | exact mirror |
| `ValidationMetric` | `ValidationMetric` | exact mirror |
| `AppliedCorrection` | `AppliedCorrection` | exact mirror |
| `ExperimentPlan` | `ExperimentPlan` | exact mirror |
| `GeneratePlanRequest` | (none — raw `{hypothesis}` body) | min_length=20 enforced both ends |
| `GeneratePlanResponse` | `GeneratePlanResponse` | exact mirror |
| `FeedbackRequest` | `FeedbackPayload` | renamed; otherwise mirror |

## Deployment Topology

There is none. Both parts run on `localhost`. A future deploy would need:

- Backend: container or PaaS with `GEMINI_API_KEY`, `HYDRADB_API_KEY`, `CORS_ORIGINS=https://{frontend-url}`, persistent state (SQLite swap-in for `PLANS`)
- Frontend: Vercel with `frontend` as the root directory and `API_PROXY_URL=https://{backend-url}` so `/api/*` requests are rewritten server-side
