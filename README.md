# The AI Scientist

Hack-Nation × MIT × Fulcrum Science — Challenge 04

Take a natural-language scientific hypothesis → run literature QC → generate an operationally realistic experiment plan a real lab could pick up and run on Monday. Scientist corrections feed a memory layer (HydraDB) that visibly shapes the next generated plan.

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind + shadcn/ui + Framer Motion
- **Backend:** Python 3.13 + FastAPI + httpx
- **LLM:** Google Gemini (1M ctx, structured output via Pydantic JSON schema)
- **Memory layer:** HydraDB (`recall_preferences` semantic search over scientist corrections)
- **Literature QC:** Semantic Scholar Graph API + arXiv API
- **Persistence:** SQLite for plans, corrections, and lineage

## Run

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env       # fill in HYDRADB_API_KEY + GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

Run backend tests with:

```bash
python -m unittest discover -s backend/tests
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

For Vercel, import the repository with `frontend` as the project root and set `API_PROXY_URL` to the deployed backend URL. The frontend keeps calling `/api/*` because Next.js rewrites proxy those requests server-side.

## Demo flow

1. Enter hypothesis (or pick a sample chip)
2. Literature QC runs (~2s) → novelty signal + refs
3. Plan generated (~10-20s) → protocol, materials w/ catalog #s, budget, timeline, validation, risks
4. Edit any section → submit correction → next plan for similar hypothesis applies it
