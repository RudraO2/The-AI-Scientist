# Data Models

> Source of truth: `backend/schemas.py` (Pydantic v2). Frontend mirror: `frontend/lib/types.ts`.
> No relational database — these are in-memory transport types only.

## Domain enums

```ts
type Domain = "diagnostics" | "gut_health" | "cell_biology" | "climate" | "other";
type NoveltySignal = "not_found" | "similar_work_exists" | "exact_match_found";
type FeedbackSection = "protocol" | "materials" | "budget" | "timeline" | "validation";
```

The frontend `correction-dialog` is invoked for the five `FeedbackSection` values; `risks` deliberately has no correction UI.

## ParsedHypothesis

Output of Gemini's first call. Drives literature search keywords and the plan-generation prompt.

| Field | Type | Notes |
|---|---|---|
| `intervention` | `str` | The thing being tested |
| `measurable_outcome` | `str` | What is measured |
| `threshold` | `str` | Quantitative success criterion (e.g. ">= 30% reduction") |
| `mechanism` | `str` | Hypothesized causal mechanism |
| `control_condition` | `str` | The comparison/control arm |
| `domain` | `Domain` | Best-fit research domain |
| `keywords` | `list[str]` | 3–7 search terms used by literature QC |

## LiteratureRef

```ts
{
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  url: string | null;
  abstract: string | null;       // truncated to 600 chars upstream
  similarity_reason: string | null;
}
```

`similarity_reason` is populated by `run_literature_qc` as `"Keyword overlap score: 0.XX"`.

## LiteratureQCResult

```ts
{
  novelty: NoveltySignal;
  rationale: string;
  references: LiteratureRef[];   // max 3
}
```

Novelty heuristic (see `literature.py:122-129`):

| Top score | Verdict |
|---|---|
| `< 0.20` or no candidates | `not_found` |
| `>= 0.85` | `exact_match_found` |
| else | `similar_work_exists` |

## Material

```ts
{
  name: string;
  catalog_number: string | null;
  supplier: string;
  quantity: string;              // e.g. "1 mg", "500 mL", "10 plates"
  unit_cost_usd: number;
  line_total_usd: number;
}
```

The plan prompt instructs Gemini to use real catalog numbers from named suppliers (Sigma-Aldrich, Thermo Fisher, IDT, Promega, Qiagen, Addgene, ATCC, NEB) and to fall back to `"supplier item: <descriptor>"` rather than fabricate SKUs.

## ProtocolStep

```ts
{
  step_number: number;
  title: string;
  duration_minutes: number;
  description: string;
  critical_notes: string | null;
  references: string[];          // protocol URLs/DOIs
}
```

Frontend renders `critical_notes` as an amber callout. `references` are clickable links truncated to 36 chars in the UI.

## TimelinePhase

```ts
{
  phase_name: string;
  duration_weeks: number;
  dependencies: string[];        // names of prior phases
  deliverables: string[];        // first one is shown inside the bar; rest in a list below
}
```

## ValidationMetric

```ts
{
  metric: string;
  success_threshold: string;
  measurement_method: string;
}
```

## AppliedCorrection

The visible signal that the memory loop is working.

```ts
{
  correction_text: string;       // truncated upstream to 400 chars
  relevance_score: number;       // HydraDB chunk relevancy_score
  applied_to_section: string;    // protocol | materials | budget | timeline | validation
}
```

Two paths populate this:

1. Gemini fills `applied_corrections` itself when prompted via `CORRECTIONS_BLOCK_TEMPLATE`.
2. Fallback in `main.py:101-109` — if Gemini returned an empty list but corrections were retrieved, we backfill with the top-2 corrections targeting `"protocol"`.

## ExperimentPlan

```ts
{
  title: string;
  domain: Domain;
  hypothesis_summary: string;
  parsed_hypothesis: ParsedHypothesis;

  protocol: ProtocolStep[];
  materials: Material[];
  total_budget_usd: number;

  timeline: TimelinePhase[];
  total_duration_weeks: number;

  validation: ValidationMetric[];
  risks_and_mitigations: string[];

  applied_corrections: AppliedCorrection[];
}
```

This is the dominant payload — passed end-to-end (Gemini → backend → frontend → render). The full object is the `response_schema` argument to Gemini's `generate_content` call, so the model output conforms structurally.

## Request / Response wrappers

### `GeneratePlanRequest`

```ts
{ hypothesis: string }   // 20..2000 chars
```

### `GeneratePlanResponse`

```ts
{
  plan_id: string;       // 8 hex chars
  parsed: ParsedHypothesis;
  qc: LiteratureQCResult;
  plan: ExperimentPlan;
}
```

### `FeedbackRequest`

```ts
{
  plan_id: string;
  domain: Domain;
  section: FeedbackSection;
  before_text: string;
  after_text: string;
  rationale: string;
}
```

### `FeedbackResponse`

```ts
{ success: boolean; memory_id: string; message: string; }
```

### `CorrectionItem`

Defined but unused in current code path:

```ts
{ memory_id: string; text: string; timestamp: string | null; }
```

## Persistence

There is no relational schema. `PLANS: dict[str, dict]` in `main.py` holds plan records keyed by 8-char `plan_id`. Each record:

```ts
{
  hypothesis: string;
  parsed: ParsedHypothesis;        // .model_dump()
  qc: LiteratureQCResult;          // .model_dump()
  plan: ExperimentPlan;            // .model_dump()
  domain: Domain;
}
```

Lifetime: process lifetime. Restart = wipe.

## HydraDB Memory Body Format

Plain text body with embedded tags. Used for both ingest and recall query weighting.

**Ingest body shape** (from `hydra_client._format_correction_body`):

```
[domain:{domain}] [section:{section}] Scientist correction. Original: {before[:400]} | Corrected to: {after[:400]} | Reason: {rationale[:400]}
```

**Recall query** (from `hydra_client.recall_corrections`):

```
[domain:{domain}] {user_query}
```

Note: this relies on semantic search — no native HydraDB metadata filter. The `[domain:X]` tag in the body is what biases recall toward in-domain corrections.
