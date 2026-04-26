# Source Tree Analysis

```
1HN/
├── README.md                       # Top-level run + demo flow
├── .gitignore
├── _bmad/                          # BMad install (not project source)
├── _bmad-output/                   # BMad workflow artifacts (planning docs go here)
├── docs/                           # Project documentation (this folder)
├── backend/                        # FastAPI service — Part: backend
│   ├── main.py                     # FastAPI app, lifespan, route handlers, in-memory PLANS dict
│   ├── gemini_client.py            # GeminiClient: parse_hypothesis, generate_plan (structured output)
│   ├── hydra_client.py             # HydraClient: ensure_tenant, ingest_correction, recall_corrections
│   ├── literature.py               # Async Semantic Scholar + arXiv fetch, novelty heuristic
│   ├── prompts.py                  # System + user prompt templates for Gemini
│   ├── schemas.py                  # Pydantic v2 models — public API + internal shapes
│   ├── requirements.txt            # Pinned deps (FastAPI, Pydantic, httpx, google-genai, hydra-db-python)
│   ├── .env.example                # Env template (HYDRADB_API_KEY, GEMINI_API_KEY, tenant IDs, model)
│   └── .env                        # Local secrets (gitignored)
└── frontend/                       # Next.js 15 app — Part: frontend
    ├── package.json                # Deps + scripts (dev/build/start/lint)
    ├── tsconfig.json               # Strict TS, `@/*` path alias to root
    ├── tailwind.config.ts          # Custom palettes (ink/accent/amber), font families, animations
    ├── postcss.config.mjs
    ├── next.config.mjs             # `reactStrictMode: true` only — no rewrites/headers
    ├── .env.example                # NEXT_PUBLIC_API_URL=http://localhost:8000
    ├── .env.local                  # Local override (gitignored)
    ├── app/                        # App Router root
    │   ├── layout.tsx              # Root HTML, dark mode, Source Serif 4 + Inter + JetBrains Mono, sonner Toaster
    │   ├── page.tsx                # Landing — hero + HypothesisForm + 3-step explainer cards
    │   ├── globals.css             # Tailwind base + .glass, .grid-bg, shimmer utilities
    │   └── plan/
    │       └── [id]/
    │           └── page.tsx        # Server-rendered plan page, calls getPlan(id) → PlanView + QcCard sidebar
    ├── components/
    │   ├── hypothesis-form.tsx     # Client component — Textarea + 4 sample chips + submit → /api/generate → router.push(`/plan/${id}`)
    │   ├── plan-view.tsx           # 6-tab plan UI (Protocol/Materials/Budget/Timeline/Validation/Risks) + AppliedCorrectionsBanner
    │   ├── correction-dialog.tsx   # Per-section dialog → POST /api/feedback (after_text + rationale)
    │   ├── qc-card.tsx             # Sidebar card with novelty signal + 1-3 references
    │   └── ui/                     # shadcn-style Radix primitives
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── skeleton.tsx
    │       ├── tabs.tsx
    │       └── textarea.tsx
    └── lib/
        ├── api.ts                  # fetch wrapper (generatePlan, getPlan, submitFeedback)
        ├── types.ts                # Mirrors backend Pydantic schemas — keep in sync manually
        └── utils.ts                # cn (twMerge+clsx), formatUsd, pluralize
```

## Critical Directories

| Path | Why critical |
|---|---|
| `backend/` | All server logic; entry point = `main.py` |
| `backend/schemas.py` | Single source of truth for API contract. `frontend/lib/types.ts` mirrors it manually — drift risk. |
| `backend/prompts.py` | All Gemini prompt text. Plan quality is bound by these strings. |
| `frontend/app/` | Next.js App Router pages. Adding routes = adding folders here. |
| `frontend/components/` | Feature components (4) + Radix UI primitives (7 in `ui/`) |
| `frontend/lib/api.ts` | Only HTTP boundary. All backend calls funnel here. |
| `frontend/lib/types.ts` | Shadow of `backend/schemas.py`. Must update both when API contract changes. |

## Entry Points

- **Backend HTTP entry:** `backend/main.py:41` — `app = FastAPI(...)`. Run via `uvicorn main:app`.
- **Backend lifespan warmup:** `backend/main.py:29-37` — instantiates Gemini + Hydra clients; pre-warms HydraDB tenant.
- **Frontend root:** `frontend/app/layout.tsx` (HTML shell + Toaster) → `frontend/app/page.tsx` (landing).
- **Frontend dynamic route:** `frontend/app/plan/[id]/page.tsx` — server component that calls `getPlan(id)` then renders `PlanView` + `QcCard`.

## Multi-Part Integration Boundary

- **Frontend → Backend:** `frontend/lib/api.ts` calls `${NEXT_PUBLIC_API_URL}/api/...` (default `http://localhost:8000`). Three endpoints used: `POST /api/generate`, `GET /api/plan/{id}`, `POST /api/feedback`.
- **CORS allowlist:** `backend/main.py:43-50` reads `CORS_ORIGINS` env (default `http://localhost:3000`).
- **Type contract:** Manually mirrored from `backend/schemas.py` to `frontend/lib/types.ts`. No code generation. Drift is the single biggest contract-break risk.
