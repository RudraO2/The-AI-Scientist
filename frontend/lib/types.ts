// SOURCE OF TRUTH: backend/schemas.py
// When you change a Pydantic model there, update the matching interface here.
// Run-time check: http://localhost:8000/openapi.json
// TODO: add openapi-typescript codegen post-hackathon when surface grows.

export type Domain = "diagnostics" | "gut_health" | "cell_biology" | "climate" | "other";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "JPY" | "CAD" | "AUD" | "SGD" | "CHF";

export type NoveltySignal = "not_found" | "similar_work_exists" | "exact_match_found";

export interface ParsedHypothesis {
  intervention: string;
  measurable_outcome: string;
  threshold: string;
  mechanism: string;
  control_condition: string;
  domain: Domain;
  keywords: string[];
}

export interface LiteratureRef {
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  url: string | null;
  abstract: string | null;
  similarity_reason: string | null;
}

export interface LiteratureQCResult {
  novelty: NoveltySignal;
  rationale: string;
  references: LiteratureRef[];
}

export interface Material {
  name: string;
  catalog_number: string | null;
  supplier: string;
  quantity: string;
  unit_cost_usd: number;
  line_total_usd: number;
  verified: boolean;
  purchase_url: string | null;
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  duration_minutes: number;
  description: string;
  critical_notes: string | null;
  references: string[];
}

export interface TimelinePhase {
  phase_name: string;
  duration_weeks: number;
  dependencies: string[];
  deliverables: string[];
}

export interface ValidationMetric {
  metric: string;
  success_threshold: string;
  measurement_method: string;
}

export interface AppliedCorrection {
  correction_text: string;
  relevance_score: number;
  applied_to_section: string;
  correction_id: number | null;
  source_plan_id: string | null;
}

export interface ExperimentPlan {
  title: string;
  domain: Domain;
  hypothesis_summary: string;
  parsed_hypothesis: ParsedHypothesis;
  protocol: ProtocolStep[];
  materials: Material[];
  total_budget_usd: number;
  currency: Currency;
  timeline: TimelinePhase[];
  total_duration_weeks: number;
  validation: ValidationMetric[];
  risks_and_mitigations: string[];
  applied_corrections: AppliedCorrection[];
}

export interface GeneratePlanResponse {
  plan_id: string;
  parsed: ParsedHypothesis;
  qc: LiteratureQCResult;
  plan: ExperimentPlan;
}

export interface RecalledCorrectionSummary {
  text: string;
  score: number;
  section_hint: string | null;
}

export interface ParseQcResponse {
  plan_id: string;
  parsed: ParsedHypothesis;
  qc: LiteratureQCResult;
  recalled_corrections: RecalledCorrectionSummary[];
  hypothesis?: string | null;
  currency?: Currency;
}

export interface LineageEntry {
  correction_id: number;
  section: string;
  applied_section: string;
  before_text: string;
  after_text: string;
  rating: number | null;
  annotation: string | null;
  rationale: string;
  source_plan_id: string;
  source_domain: string | null;
  source_created_at: string | null;
}

export interface HistoryItem {
  correction_id: number;
  plan_id: string;
  section: string;
  domain: Domain;
  before_text: string;
  after_text: string;
  rating: number | null;
  annotation: string | null;
  rationale: string;
  created_at: string;
  applied_count: number;
}

export type FeedbackSection = "protocol" | "materials" | "budget" | "timeline" | "validation" | "risks";

export interface FeedbackPayload {
  plan_id: string;
  domain: Domain;
  section: FeedbackSection;
  before_text: string;
  after_text: string;
  rationale: string;
  rating?: number | null;
  annotation?: string | null;
}
