// Mirrors backend Pydantic schemas. Keep in sync.

export type Domain = "diagnostics" | "gut_health" | "cell_biology" | "climate" | "other";

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
}

export interface ExperimentPlan {
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

export interface GeneratePlanResponse {
  plan_id: string;
  parsed: ParsedHypothesis;
  qc: LiteratureQCResult;
  plan: ExperimentPlan;
}

export type FeedbackSection = "protocol" | "materials" | "budget" | "timeline" | "validation";

export interface FeedbackPayload {
  plan_id: string;
  domain: Domain;
  section: FeedbackSection;
  before_text: string;
  after_text: string;
  rationale: string;
}
