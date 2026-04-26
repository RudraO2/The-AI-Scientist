from __future__ import annotations
from unittest import TestCase

from schemas import (
    AppliedCorrection,
    ExperimentPlan,
    Material,
    ParsedHypothesis,
    ProtocolStep,
    TimelinePhase,
    ValidationMetric,
)
from validation import LABOUR_OVERHEAD_FRACTION, looks_like_sku, normalize_plan, supplier_recognized


def _plan(materials: list[Material], gemini_total: float = 9999.99) -> ExperimentPlan:
    parsed = ParsedHypothesis(
        intervention="x", measurable_outcome="y", threshold=">= 1",
        mechanism="m", control_condition="c", domain="diagnostics", keywords=["a"],
    )
    return ExperimentPlan(
        title="t", domain="diagnostics", hypothesis_summary="s", parsed_hypothesis=parsed,
        protocol=[ProtocolStep(step_number=1, title="s", duration_minutes=1, description="d")],
        materials=materials,
        total_budget_usd=gemini_total,
        timeline=[TimelinePhase(phase_name="p", duration_weeks=1, dependencies=[], deliverables=[])],
        total_duration_weeks=1,
        validation=[ValidationMetric(metric="m", success_threshold="t", measurement_method="x")],
        risks_and_mitigations=["r"],
        applied_corrections=[],
    )


class ValidationTests(TestCase):
    def test_sku_shape(self) -> None:
        self.assertTrue(looks_like_sku("M0202S"))
        self.assertTrue(looks_like_sku("12605010"))
        self.assertTrue(looks_like_sku("CRL-1573"))
        self.assertFalse(looks_like_sku(None))
        self.assertFalse(looks_like_sku(""))
        self.assertFalse(looks_like_sku("ask supplier for kit"))
        self.assertFalse(looks_like_sku("unknown"))

    def test_supplier_recognised(self) -> None:
        self.assertTrue(supplier_recognized("Sigma-Aldrich"))
        self.assertTrue(supplier_recognized("Thermo Fisher Scientific"))
        self.assertTrue(supplier_recognized("NEB"))
        self.assertFalse(supplier_recognized("BobsReagents"))
        self.assertFalse(supplier_recognized(""))

    def test_budget_recomputed_overrides_llm(self) -> None:
        materials = [
            Material(name="A", catalog_number="M0202S", supplier="NEB",
                     quantity="1 vial", unit_cost_usd=50.0, line_total_usd=50.0),
            Material(name="B", catalog_number=None, supplier="Random",
                     quantity="1 mg", unit_cost_usd=25.0, line_total_usd=25.0),
        ]
        plan = normalize_plan(_plan(materials, gemini_total=9999.99))
        expected = round(75.0 * (1 + LABOUR_OVERHEAD_FRACTION), 2)
        self.assertEqual(plan.total_budget_usd, expected)

    def test_verified_flag_set(self) -> None:
        materials = [
            Material(name="A", catalog_number="M0202S", supplier="NEB",
                     quantity="1 vial", unit_cost_usd=50.0, line_total_usd=50.0),
            Material(name="B", catalog_number="ask supplier", supplier="Sigma-Aldrich",
                     quantity="1 mg", unit_cost_usd=25.0, line_total_usd=25.0),
            Material(name="C", catalog_number="M0202S", supplier="BobsReagents",
                     quantity="1 mg", unit_cost_usd=25.0, line_total_usd=25.0),
        ]
        plan = normalize_plan(_plan(materials))
        self.assertTrue(plan.materials[0].verified)
        self.assertFalse(plan.materials[1].verified)
        self.assertFalse(plan.materials[2].verified)
