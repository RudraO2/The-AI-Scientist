# Development Guide

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Python | 3.13 | Backend runtime |
| Node.js | 18+ (matches Next 15 requirements) | Frontend runtime |
| `pip` / `venv` | bundled with Python | Backend deps |
| `npm` | bundled with Node | Frontend deps |
| Google AI Studio API key | — | Gemini calls |
| HydraDB API key | — | Memory layer |

Optional: Semantic Scholar API key (works without — keyless is rate-limited).

## First-Time Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and HYDRADB_API_KEY
```

`.env` template:

```
HYDRADB_API_KEY=your_hydradb_key_here
GEMINI_API_KEY=your_gemini_key_here
HYDRA_TENANT_ID=ai-scientist-test
HYDRA_SUB_TENANT_ID=default
GEMINI_MODEL=gemini-3-flash-preview
SEMANTIC_SCHOLAR_API_KEY=
CORS_ORIGINS=http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

`.env.local` template:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running Locally

Two terminals — one per part.

### Terminal 1 — Backend

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"ok":true}`

The lifespan hook will pre-warm the HydraDB tenant on first start. Cold-start can take up to 60s if the tenant's vectorstore is provisioning. A failed warmup is logged but does not block the server — the first request that needs HydraDB will retry.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Verify: open `http://localhost:3000`.

### Demo Flow

1. Click a sample chip (Diagnostics / Gut Health / Cell Biology / Climate) or paste a hypothesis ≥20 chars.
2. Click "Generate Plan". Spinner runs ~22s (parse + parallel QC/recall + generate).
3. Plan page opens. Inspect the 6 tabs.
4. Hover any protocol step or open Materials/Budget/Timeline/Validation headers → "Correct" button. Edit `after_text`, fill `rationale` ≥10 chars, submit.
5. Generate a similar hypothesis again — observe "Applied past correction" banner with the recalled correction.

## Build Commands

### Frontend

```bash
npm run dev      # next dev — local with HMR
npm run build    # next build — production bundle (untested in this repo today)
npm run start    # next start — serve the production bundle
npm run lint     # next lint
```

### Backend

No build step. Python interpreted directly. Production launch would drop `--reload`:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Testing

Backend tests exist and can be run with `python -m unittest discover -s backend/tests`.

If adding frontend tests next:

- Frontend: Vitest + React Testing Library; e2e via Playwright would cover the form → plan flow.

## Common Tasks

### Adding a new sample hypothesis chip

Edit `frontend/components/hypothesis-form.tsx:13-42` (`SAMPLES` array). Each entry: `{icon, label, color, text}`. Pick from `lucide-react` icons.

### Adding a new plan section/tab

1. Extend `ExperimentPlan` in `backend/schemas.py`.
2. Mirror the change in `frontend/lib/types.ts`.
3. Add a `<TabsTrigger>` and `<TabsContent>` in `frontend/components/plan-view.tsx`.
4. Update the `GENERATE_PLAN_SYSTEM` prompt in `backend/prompts.py` to instruct Gemini about the new section.
5. (Optional) Wire a `<CorrectionDialog>` for the new section if it should be correctable. Add the new `FeedbackSection` literal in both `backend/schemas.py` and `frontend/lib/types.ts`.

### Tightening the plan prompt

`backend/prompts.py:GENERATE_PLAN_SYSTEM`. The "CRITICAL RULES" block is the highest-leverage knob — adding constraints there directly affects plan quality.

### Changing the Gemini model

Set `GEMINI_MODEL` in `backend/.env`. Avoid `gemini-pro` (rate-limited on free tier per smoke test).

### Persistence

SQLite now stores plans, corrections, and lineage in `backend/db.py`. If you extend persistence, keep the `plans`, `corrections`, and `applied` tables in sync with the API contract.

### Editing prompts safely

The plan-generation prompt is large. To iterate:

1. Edit `prompts.py`.
2. Restart uvicorn (auto-reloads with `--reload`).
3. Hit `POST /api/generate` via the frontend or Swagger UI at `http://localhost:8000/docs`.

## Type Contract Sync

Whenever you edit `backend/schemas.py`, mirror the change in `frontend/lib/types.ts`. There is no codegen.

A future improvement would generate TS types from FastAPI's OpenAPI spec via `openapi-typescript` — but that's deferred (hackathon scope).

## Debugging

### Backend not picking up `.env`

`load_dotenv()` runs at module import in `main.py:9`. Ensure `.env` lives in `backend/` (same dir as `main.py`), not the repo root.

### "Plan not found" right after generating

Backend was restarted between generate and view. Plans are in-memory only.

### "Applied past correction" never appears

- Recall fails soft (returns `[]`). Hit `POST /api/recall` with the same hypothesis to see what HydraDB returns.
- HydraDB tenant may still be provisioning — the recall path only waits 5s. Wait, retry, or call `/api/feedback` once first to force-warm the tenant (it waits up to 120s on ingest).

### CORS errors

Set `CORS_ORIGINS=http://localhost:3000` (or your frontend origin) in backend `.env`. Restart.

### Gemini "rate limited" / "quota exceeded"

Likely `gemini-pro` instead of `gemini-3-flash-preview`. Check `GEMINI_MODEL` env.

## Repository Layout

See [Source Tree Analysis](./source-tree-analysis.md) for the annotated tree.

## Deployment

None today. Future work:

- Backend → containerise (uvicorn + gunicorn worker, port 8000), set env vars, wire to managed Postgres/Redis if persistent state is needed
- Frontend → Vercel with `frontend` as the project root, set `API_PROXY_URL` to the backend base URL, and keep browser traffic on same-origin `/api/*` requests via Next.js rewrites
