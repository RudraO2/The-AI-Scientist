"""Pydantic models — public API contracts + internal data shapes."""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


Domain = Literal["diagnostics", "gut_health", "cell_biology", "climate", "other"]

Currency = Literal["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "SGD", "CHF"]
DEFAULT_CURRENCY: Currency = "USD"


class ParsedHypothesis(BaseModel):
    """Structured decomposition of the user's natural-language hypothesis."""
    intervention: str = Field(description="The thing being tested (drug, microbe, technique).")
    measurable_outcome: str = Field(description="What is measured.")
    threshold: str = Field(description="Quantitative success criterion (e.g. '>= 30% reduction').")
    mechanism: str = Field(description="Hypothesized causal mechanism.")
    control_condition: str = Field(description="The comparison/control arm.")
    domain: Domain = Field(description="Best-fit research domain.")
    keywords: list[str] = Field(default_factory=list, description="3-7 search terms for literature QC.")


class LiteratureRef(BaseModel):
    title: str
    authors: list[str] = Field(default_factory=list)
    year: Optional[int] = None
    venue: Optional[str] = None
    url: Optional[str] = None
    abstract: Optional[str] = None
    similarity_reason: Optional[str] = Field(default=None, description="Why this paper is relevant.")


NoveltySignal = Literal["not_found", "similar_work_exists", "exact_match_found"]


class LiteratureQCResult(BaseModel):
    novelty: NoveltySignal
    rationale: str
    references: list[LiteratureRef] = Field(default_factory=list, max_length=3)


class Material(BaseModel):
    name: str
    catalog_number: Optional[str] = None
    supplier: str
    quantity: str = Field(description="e.g. '1 mg', '500 mL', '10 plates'")
    unit_cost_usd: float
    line_total_usd: float
    verified: bool = Field(
        default=False,
        description="True when supplier is recognised AND catalog_number matches a SKU shape. Set server-side, not by the model.",
    )
    purchase_url: Optional[str] = Field(
        default=None,
        description="Direct product/SKU URL on the supplier site, OR a supplier search-results URL pre-filled with the catalog number. Set by the model when known; the server fills a search URL when missing.",
    )


class ProtocolStep(BaseModel):
    step_number: int
    title: str
    duration_minutes: int
    description: str
    critical_notes: Optional[str] = Field(default=None, description="Pitfalls / parameter warnings.")
    references: list[str] = Field(default_factory=list, description="Source protocol URLs/DOIs.")


class TimelinePhase(BaseModel):
    phase_name: str
    duration_weeks: float
    dependencies: list[str] = Field(default_factory=list)
    deliverables: list[str] = Field(default_factory=list)


class ValidationMetric(BaseModel):
    metric: str
    success_threshold: str
    measurement_method: str


class AppliedCorrection(BaseModel):
    """A scientist correction from HydraDB that influenced this plan."""
    correction_text: str
    relevance_score: float
    applied_to_section: str = Field(description="protocol|materials|budget|timeline|validation|risks")
    correction_id: Optional[int] = None
    source_plan_id: Optional[str] = None


class ExperimentPlan(BaseModel):
    title: str
    domain: Domain
    hypothesis_summary: str
    parsed_hypothesis: ParsedHypothesis

    protocol: list[ProtocolStep]
    materials: list[Material]
    total_budget_usd: float
    currency: Currency = DEFAULT_CURRENCY

    timeline: list[TimelinePhase]
    total_duration_weeks: float

    validation: list[ValidationMetric]
    risks_and_mitigations: list[str]

    applied_corrections: list[AppliedCorrection] = Field(default_factory=list)


# ---------- API request/response wrappers ----------

class GeneratePlanRequest(BaseModel):
    hypothesis: str = Field(min_length=20, max_length=2000)
    currency: Currency = DEFAULT_CURRENCY


class EnhanceHypothesisRequest(BaseModel):
    hypothesis: str = Field(min_length=5, max_length=2000)


class EnhanceHypothesisResponse(BaseModel):
    hypothesis: str


class GeneratePlanResponse(BaseModel):
    plan_id: str
    parsed: ParsedHypothesis
    qc: LiteratureQCResult
    plan: ExperimentPlan


class FeedbackRequest(BaseModel):
    plan_id: str
    domain: Domain
    section: Literal["protocol", "materials", "budget", "timeline", "validation", "risks"]
    before_text: str
    after_text: str
    rationale: str = Field(default="", description="Why the scientist made this correction.")
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    annotation: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
    memory_id: Optional[str]
    correction_id: int
    message: str


class CorrectionItem(BaseModel):
    memory_id: str
    text: str
    timestamp: Optional[str] = None


class RecalledCorrectionSummary(BaseModel):
    """Summary of a Hydra-recalled correction shown on QC interstitial (pre-plan)."""
    text: str
    score: float
    section_hint: Optional[str] = None


class ParseQcResponse(BaseModel):
    plan_id: str
    parsed: ParsedHypothesis
    qc: LiteratureQCResult
    recalled_corrections: list[RecalledCorrectionSummary] = Field(default_factory=list)
    hypothesis: Optional[str] = None
    currency: Currency = DEFAULT_CURRENCY


class LineageEntry(BaseModel):
    correction_id: int
    section: str
    applied_section: str
    before_text: str
    after_text: str
    rating: Optional[int] = None
    annotation: Optional[str] = None
    rationale: str
    source_plan_id: str
    source_domain: Optional[str] = None
    source_created_at: Optional[str] = None


class RecallQuery(BaseModel):
    query: str
    domain: str | None = None
    top_k: int = 5


class HistoryItem(BaseModel):
    correction_id: int
    plan_id: str
    section: str
    domain: Domain
    before_text: str
    after_text: str
    rating: Optional[int] = None
    annotation: Optional[str] = None
    rationale: str
    created_at: str
    applied_count: int
