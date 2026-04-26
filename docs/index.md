# The AI Scientist — Documentation Index

> Generated: 2026-04-26 · Mode: initial_scan · Scan level: deep · Scope: Hack-Nation × MIT × Fulcrum Challenge 04

This index is the primary entry point for AI-assisted development on this repo. Point new agents (BMad dev, story creators, code reviewers) here first.

## Project Overview

- **Type:** multi-part monorepo (2 parts: `backend`, `frontend`)
- **Repository root:** `C:\Users\rpxi1\OneDrive\Documents\Desktop\1HN`
- **Primary languages:** Python 3.13 (backend), TypeScript / React 19 (frontend)
- **Architecture:** FastAPI service-oriented backend ↔ Next.js 15 App Router frontend, talking over JSON over HTTP
- **Deployment status:** local-only (ports 3000 + 8000); no remote deploy

## Quick Reference

### backend (Python / FastAPI)

- **Tech:** FastAPI 0.115 · Pydantic v2 · httpx · `google-genai` 1.27 · `hydra-db-python` 0.1.6
- **Entry point:** `backend/main.py` (`uvicorn main:app --reload --port 8000`)
- **Routes:** `POST /api/generate`, `GET /api/plan/{id}`, `POST /api/feedback`, `POST /api/recall`, `GET /health`
- **Persistence:** in-memory `dict` (`PLANS`) keyed by `plan_id`. Resets on restart.
- **External calls:** Gemini (parse + plan), Semantic Scholar Graph API + arXiv Atom (literature QC), HydraDB (correction memory)

### frontend (Next.js / React)

- **Tech:** Next.js 15.1 · React 19 · Tailwind 3 · Radix primitives · Framer Motion · sonner
- **Entry point:** `frontend/app/layout.tsx`, `frontend/app/page.tsx`
- **Routes:** `/` (hypothesis form + samples), `/plan/[id]` (plan view + QC sidebar)
- **API client:** `frontend/lib/api.ts` (single `request<T>` wrapper, no SWR/React Query)
- **State:** local component state only — no Redux/Zustand/Context

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture — Backend](./architecture-backend.md)
- [Architecture — Frontend](./architecture-frontend.md)
- [Integration Architecture](./integration-architecture.md)
- [API Contracts — Backend](./api-contracts-backend.md)
- [Data Models](./data-models.md)
- [Component Inventory — Frontend](./component-inventory-frontend.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Development Guide](./development-guide.md)

## Existing Documentation

- [README.md](../README.md) — top-level run instructions and demo flow

## Getting Started

1. Backend — `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && cp .env.example .env` (fill `GEMINI_API_KEY`, `HYDRADB_API_KEY`) → `uvicorn main:app --reload --port 8000`
2. Frontend — `cd frontend && npm install && cp .env.example .env.local` → `npm run dev`
3. Open `http://localhost:3000`. Pick a sample chip or paste a hypothesis ≥20 chars.

## Brownfield PRD Command

When planning new features, run the PRD workflow and provide this index as input. For UI-only work reference [architecture-frontend](./architecture-frontend.md). For API-only work reference [architecture-backend](./architecture-backend.md). Full-stack work needs both plus [integration-architecture](./integration-architecture.md).

## Known Hackathon-Scope Gaps

- No persistent DB. `PLANS` dict in `main.py` is volatile — backend restart wipes plans.
- No auth, no per-user multi-tenant. Single shared HydraDB tenant: `ai-scientist-test`.
- No streaming responses. Plan generation blocks ~17s with spinner.
- No deployment. Localhost only.
- HydraDB free tier limits: 2 tenants max, 100k tokens ingest.
- `recall_preferences` used (not `full_recall` — confirmed empty in smoke test).
