# Project Overview

## Name

**The AI Scientist** — Hack-Nation × MIT × Fulcrum Science, Challenge 04.

## Purpose

Compress weeks of experimental scoping into a single prompt: take a natural-language scientific hypothesis, run a literature QC pass, and emit an operationally realistic experiment plan that a real lab could begin executing within a week. Stretch goal: scientist corrections feed a memory layer that visibly shapes the next generated plan.

## What It Does

1. User submits a hypothesis (≥20 chars) or selects a sample chip (Diagnostics, Gut Health, Cell Biology, Climate).
2. Backend parses hypothesis via Gemini structured output → `ParsedHypothesis` (intervention, measurable outcome, threshold, mechanism, control, domain, keywords).
3. In parallel, Literature QC runs (Semantic Scholar + arXiv) and HydraDB recalls past corrections in the same domain.
4. Gemini generates a full `ExperimentPlan` (protocol steps, materials with catalog numbers, budget, timeline phases, validation metrics, risks). If past corrections exist, the system prompt instructs Gemini to apply them silently and list them in `applied_corrections`.
5. Frontend renders plan in 6 tabs (Protocol / Materials / Budget / Timeline / Validation / Risks). Each section has a "Correct" dialog that ingests scientist feedback to HydraDB. The plan view shows an "Applied past correction" banner when corrections were retrieved.

## Architecture Summary

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · TS · Tailwind 3 · Radix · Framer Motion · sonner | Dark theme glassmorphism, Source Serif 4 headings |
| Backend | Python 3.13 · FastAPI 0.115 · Pydantic v2 · httpx 0.28 | Async orchestration via `asyncio.gather` + `to_thread` for sync SDK calls |
| LLM | Google Gemini via `google-genai==1.27.0`, model `gemini-3-flash-preview` | Structured JSON output via Pydantic schema. `gemini-pro` rate-limited on free tier — avoid. |
| Memory | HydraDB via `hydra-db-python==0.1.6`, tenant `ai-scientist-test` | `upload.add_memory` for ingest; `recall.recall_preferences` for retrieval (NOT `full_recall` — returns 0 chunks). |
| Lit QC | Semantic Scholar Graph API + arXiv Atom feed | Parallel fetch, novelty heuristic by keyword overlap |
| Persistence | In-memory `dict` keyed by `plan_id` | No DB — backend restart wipes plans. |

## Repository Type

Multi-part monorepo. Two distinct technology stacks under one root:

- `backend/` — Python/FastAPI service
- `frontend/` — Next.js application

Detected by presence of both `backend/requirements.txt` (Python) and `frontend/package.json` (Node). No shared workspace tooling (no Turborepo, no Nx) — each part is run independently.

## Project Classification

| Part | Project Type | Justification |
|---|---|---|
| backend | `backend` (API/service) | FastAPI + REST endpoints + Pydantic schemas, no SSR/UI rendering |
| frontend | `web` | Next.js App Router + React + browser-side fetch + Tailwind |

## Performance Characteristics (Verified Locally)

- Hypothesis parse: ~3s
- Literature QC: ~2s (parallel Semantic Scholar + arXiv)
- Plan generation: ~17s (Gemini blocking call, no streaming)
- Total cold path: ~22s wall-clock for first plan

## Deliverables Tracked Against Hackathon Brief

| Deliverable | Status |
|---|---|
| 150–300 word project summary | not in repo |
| 60s demo video | not in repo |
| 60s tech video | not in repo |
| GitHub repo | pushed: `RudraO2/The-AI-Scientist` |
| Zipped code | not produced |
| Dataset link | undecided |
