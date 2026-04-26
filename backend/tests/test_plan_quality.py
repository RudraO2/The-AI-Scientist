"""Run quality.check_plan against the four hand-built golden plans and against
a deliberately thin counterexample. Acts as the regression baseline for plan depth.
"""
from __future__ import annotations
from unittest import TestCase

from quality import (
    MIN_PROTOCOL_STEPS, MIN_MATERIALS, MIN_VALIDATION,
    MIN_TIMELINE_PHASES, MIN_RISKS,
    check_plan,
)
from validation import normalize_plan
from tests.golden_plans import GOLDEN_PLAN_BUILDERS
from tests.test_main import build_plan as build_thin_plan


class GoldenPlanQualityTests(TestCase):
    def test_each_golden_plan_passes_depth_floor(self) -> None:
        for name, builder in GOLDEN_PLAN_BUILDERS.items():
            with self.subTest(plan=name):
                plan = normalize_plan(builder())
                issues = check_plan(plan)
                self.assertEqual(issues, [],
                    f"{name} failed quality bar: {[str(i) for i in issues]}")

    def test_thin_plan_fails_quality_check(self) -> None:
        # FakeGeminiClient.build_plan in test_main is a deliberate stripped-down plan;
        # quality.check_plan must reject it so we know the bar bites.
        plan = build_thin_plan()
        issues = check_plan(plan)
        self.assertGreater(len(issues), 0,
            "quality.check_plan should reject the thin reference plan")
        sections = {i.section for i in issues}
        # The thin plan has 1 of each — every floored section should fire.
        for section in {"protocol", "materials", "validation", "timeline", "risks"}:
            self.assertIn(section, sections)

    def test_quality_floors_match_prompt(self) -> None:
        # Sanity: prompt thresholds and quality.py thresholds must agree.
        # If you change one, change the other; this test guards the link.
        from prompts import GENERATE_PLAN_SYSTEM
        self.assertIn(f"at least {MIN_PROTOCOL_STEPS} steps", GENERATE_PLAN_SYSTEM)
        self.assertIn(f"at least {MIN_MATERIALS} line items", GENERATE_PLAN_SYSTEM)
        self.assertIn(f"at least {MIN_TIMELINE_PHASES} phases", GENERATE_PLAN_SYSTEM)
        self.assertIn(f"at least {MIN_VALIDATION} metrics", GENERATE_PLAN_SYSTEM)
        self.assertIn(f"at least {MIN_RISKS} entries", GENERATE_PLAN_SYSTEM)
