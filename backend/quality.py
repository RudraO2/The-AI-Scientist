"""Plan quality checker.

Structural depth checks that approximate "would a working scientist take this
seriously?". Returns a list of human-readable issues; empty list means the plan
clears the bar. The thresholds match the floors stated in the system prompt
(prompts.GENERATE_PLAN_SYSTEM); update both together if you change one.
"""
from __future__ import annotations
from dataclasses import dataclass

from schemas import ExperimentPlan
from validation import supplier_recognized


MIN_PROTOCOL_STEPS = 10
MIN_MATERIALS = 12
MIN_VALIDATION = 4
MIN_TIMELINE_PHASES = 4
MIN_RISKS = 4

MIN_STEP_DESCRIPTION_CHARS = 80
MIN_CRITICAL_NOTES_FRACTION = 0.5
MIN_RECOGNISED_SUPPLIER_FRACTION = 0.5


@dataclass(frozen=True)
class QualityIssue:
    section: str
    message: str

    def __str__(self) -> str:
        return f"[{self.section}] {self.message}"


def check_plan(plan: ExperimentPlan) -> list[QualityIssue]:
    issues: list[QualityIssue] = []

    if len(plan.protocol) < MIN_PROTOCOL_STEPS:
        issues.append(QualityIssue("protocol",
            f"only {len(plan.protocol)} steps; minimum {MIN_PROTOCOL_STEPS}"))
    short_steps = [s for s in plan.protocol if len(s.description) < MIN_STEP_DESCRIPTION_CHARS]
    if short_steps:
        issues.append(QualityIssue("protocol",
            f"{len(short_steps)} step(s) have description < {MIN_STEP_DESCRIPTION_CHARS} chars"))
    if plan.protocol:
        with_notes = sum(1 for s in plan.protocol if (s.critical_notes or "").strip())
        frac = with_notes / len(plan.protocol)
        if frac < MIN_CRITICAL_NOTES_FRACTION:
            issues.append(QualityIssue("protocol",
                f"only {with_notes}/{len(plan.protocol)} steps have critical_notes "
                f"(< {int(MIN_CRITICAL_NOTES_FRACTION*100)}%)"))

    if len(plan.materials) < MIN_MATERIALS:
        issues.append(QualityIssue("materials",
            f"only {len(plan.materials)} items; minimum {MIN_MATERIALS}"))
    if plan.materials:
        recognised = sum(1 for m in plan.materials if supplier_recognized(m.supplier))
        frac = recognised / len(plan.materials)
        if frac < MIN_RECOGNISED_SUPPLIER_FRACTION:
            issues.append(QualityIssue("materials",
                f"only {recognised}/{len(plan.materials)} items use a recognised supplier "
                f"(< {int(MIN_RECOGNISED_SUPPLIER_FRACTION*100)}%)"))

    if plan.total_budget_usd <= 0:
        issues.append(QualityIssue("budget", "total_budget_usd is not positive"))

    if len(plan.timeline) < MIN_TIMELINE_PHASES:
        issues.append(QualityIssue("timeline",
            f"only {len(plan.timeline)} phases; minimum {MIN_TIMELINE_PHASES}"))

    if len(plan.validation) < MIN_VALIDATION:
        issues.append(QualityIssue("validation",
            f"only {len(plan.validation)} metrics; minimum {MIN_VALIDATION}"))
    soft_thresholds = [v for v in plan.validation if not any(ch.isdigit() for ch in v.success_threshold)]
    if soft_thresholds:
        issues.append(QualityIssue("validation",
            f"{len(soft_thresholds)} metric(s) have non-quantitative success_threshold"))

    if len(plan.risks_and_mitigations) < MIN_RISKS:
        issues.append(QualityIssue("risks",
            f"only {len(plan.risks_and_mitigations)} risks; minimum {MIN_RISKS}"))

    return issues


def is_plan_acceptable(plan: ExperimentPlan) -> bool:
    return not check_plan(plan)
