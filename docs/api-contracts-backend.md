# API Contracts — Backend

> Generated from `backend/main.py` and `backend/schemas.py`. Source of truth: Pydantic schemas in `backend/schemas.py`. The frontend mirror lives in `frontend/lib/types.ts`.

Base URL (dev): `http://localhost:8000`

## Endpoints

### `GET /health`

Liveness probe.

**Response 200**

```json
{"ok": true}
```

---

### `POST /api/parse_qc`

Parse hypothesis, run literature QC, recall corrections, and persist the partial plan record.

**Request body** — `GeneratePlanRequest`

```json
{
  "hypothesis": "string (20..2000 chars)"
}
```

**Validation:** `min_length=20, max_length=2000`. Frontend enforces `≥20` before enabling submit.

**Response 200** — `GeneratePlanResponse`

```json
{
  "plan_id": "8-char hex string",
  "parsed": ParsedHypothesis,
  "qc": LiteratureQCResult,
  "recalled_corrections": [
    {
      "text": "string",
      "score": 0.0,
      "section_hint": "protocol | materials | budget | timeline | validation | null"
    }
  ]
}
```

**Errors**

| Status | Detail |
|---|---|
| 422 | Pydantic validation failure on `hypothesis` length |
| 502 | `Hypothesis parse failed: {e}` (Gemini parse error) |

**Side effects**

- Stores `{hypothesis, parsed, qc, domain}` in SQLite.
- Triggers parallel HydraDB recall (read-only) and parallel literature search (read-only).

---

### `POST /api/plan/{plan_id}/generate`

Generate the full plan from the parsed hypothesis and QC result.

**Response 200** — `GeneratePlanResponse`

```json
{
  "plan_id": "8-char hex string",
  "parsed": ParsedHypothesis,
  "qc": LiteratureQCResult,
  "plan": ExperimentPlan
}
```

**Errors**

| Status | Detail |
|---|---|
| 404 | `Plan not found` |
| 404 | `Plan generation not yet complete` |
| 502 | `Plan generation failed: {e}` (Gemini generate error) |

**Side effects**

- Fills the plan payload in SQLite.
- Populates `applied_corrections` when the model surfaces recalled memory.

**Latency (verified, local)**: ~22s wall-clock (3s parse + 2s parallel QC/recall + 17s generate).

---

### `GET /api/plan/{plan_id}`

Re-fetch a previously generated plan.

**Path params**

- `plan_id`: 8-char hex returned by `/api/generate`

**Response 200** — `GeneratePlanResponse` (same as above)

**Errors**

| Status | Detail |
|---|---|
| 404 | `Plan not found` |

SQLite persists plan records, so restarts no longer wipe plans.

---

### `POST /api/feedback`

Store a scientist correction in HydraDB and record the correction locally.

**Request body** — `FeedbackRequest`

```json
{
  "plan_id": "string",
  "domain": "diagnostics | gut_health | cell_biology | climate | other",
  "section": "protocol | materials | budget | timeline | validation",
  "before_text": "string",
  "after_text": "string",
  "rationale": "string"
}
```

The frontend constructs `before_text` per-section from the relevant plan slice (e.g. for materials: `"{name} ({supplier} #{cat}) — {qty} @ {usd}"` joined with `\n`). `after_text` defaults to `before_text` and the user edits inline. `rationale` must be ≥10 chars (frontend-enforced).

**Response 200** — `FeedbackResponse`

```json
{
  "success": true,
  "memory_id": "HydraDB source_id",
  "message": "Correction stored. Future plans for similar experiments will incorporate it."
}
```

**Errors**

| Status | Detail |
|---|---|
| 502 | `HydraDB ingest failed: {e}` (this is loud-fail — see `hydra_client.ingest_correction`) |

**Side effects**

- Calls `ensure_tenant(max_wait_seconds=120.0)` — blocks up to 2 min waiting for vectorstore on a cold tenant.
- Writes one memory body to HydraDB tenant `ai-scientist-test` / sub `default`. Body shape: `[domain:X] [section:Y] Scientist correction. Original: {before[:400]} | Corrected to: {after[:400]} | Reason: {rationale[:400]}`.

The local SQLite row is still written even if Hydra ingest fails.

---

### `POST /api/recall`

Debug/transparency endpoint. Returns the raw recall hits HydraDB would surface for a query.

**Request body**

```json
{
  "query": "string",
  "domain": "diagnostics | ... | other | null",
  "top_k": 5
}
```

**Response 200**

```json
{
  "hits": [
    {"text": "string", "score": 0.0..1.0, "source_id": "string"},
    ...
  ],
  "count": 0
}
```

This endpoint is **not** called by the frontend today. Useful for inspecting what the memory layer is doing during demos.

---

## Pydantic Schema Reference

See [Data Models](./data-models.md) for the full schema definitions.

## OpenAPI

FastAPI auto-generates OpenAPI at `http://localhost:8000/openapi.json` and Swagger UI at `http://localhost:8000/docs`. Useful when the manual TS mirror falls out of sync.
