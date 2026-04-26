from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from fastapi.testclient import TestClient

import db
import main
from schemas import (
    AppliedCorrection,
    ExperimentPlan,
    FeedbackRequest,
    LiteratureQCResult,
    Material,
    ParsedHypothesis,
    ProtocolStep,
    TimelinePhase,
    ValidationMetric,
)


def build_parsed() -> ParsedHypothesis:
    return ParsedHypothesis(
        intervention="Test intervention",
        measurable_outcome="Outcome",
        threshold=">= 20% improvement",
        mechanism="Mechanism",
        control_condition="Placebo",
        domain="diagnostics",
        keywords=["test", "intervention"],
    )


def build_plan() -> ExperimentPlan:
    parsed = build_parsed()
    return ExperimentPlan(
        title="Test plan",
        domain=parsed.domain,
        hypothesis_summary="Summary",
        parsed_hypothesis=parsed,
        protocol=[ProtocolStep(step_number=1, title="Step 1", duration_minutes=10, description="Do the thing")],
        materials=[Material(name="Reagent", supplier="Supplier", quantity="1 vial", unit_cost_usd=10.0, line_total_usd=10.0)],
        total_budget_usd=100.0,
        timeline=[TimelinePhase(phase_name="Phase 1", duration_weeks=1.0, dependencies=[], deliverables=["Done"])],
        total_duration_weeks=1.0,
        validation=[ValidationMetric(metric="Signal", success_threshold=">= 1.2x", measurement_method="Assay")],
        risks_and_mitigations=["Risk 1"],
        applied_corrections=[AppliedCorrection(correction_text="Use standard buffer", relevance_score=0.91, applied_to_section="protocol")],
    )


class FakeGeminiClient:
    def parse_hypothesis(self, hypothesis: str) -> ParsedHypothesis:
        return build_parsed()

    def generate_plan(self, **kwargs) -> ExperimentPlan:
        return build_plan()


class FakeHydraClient:
    def ensure_tenant(self, max_wait_seconds: float = 60.0) -> None:
        return None

    def recall_corrections(self, *, query: str, domain: str | None = None, top_k: int = 5):
        return [{"text": "Use standard buffer", "score": 0.91, "source_id": "hydra-1"}]

    def ingest_correction(self, **kwargs) -> str:
        return "hydra-1"


class BackendApiTests(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.mkdtemp(prefix="ai-scientist-test-")
        self.original_db_path = db.DB_PATH
        db.DB_PATH = Path(self.tempdir) / "data.db"

    def tearDown(self) -> None:
        db.DB_PATH = self.original_db_path
        shutil.rmtree(self.tempdir, ignore_errors=True)

    def _client(self) -> TestClient:
        return TestClient(main.app)

    async def test_health_reports_dependency_flags(self) -> None:
        with self._client() as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ok"])
        self.assertIn("db", payload)
        self.assertIn("gemini_configured", payload)
        self.assertIn("hydra_configured", payload)

    async def test_parse_generate_and_feedback_flow(self) -> None:
        with (
            patch.object(main, "GeminiClient", FakeGeminiClient),
            patch.object(main, "HydraClient", FakeHydraClient),
            patch.object(main, "run_literature_qc", return_value=LiteratureQCResult(novelty="not_found", rationale="None", references=[])),
        ):
            with self._client() as client:
                parse_response = client.post("/api/parse_qc", json={"hypothesis": "A test hypothesis with enough detail for parsing."})
                self.assertEqual(parse_response.status_code, 200)
                plan_id = parse_response.json()["plan_id"]

                generate_response = client.post(f"/api/plan/{plan_id}/generate")
                self.assertEqual(generate_response.status_code, 200)
                plan_payload = generate_response.json()["plan"]
                self.assertGreaterEqual(len(plan_payload["applied_corrections"]), 1)

                feedback_payload = FeedbackRequest(
                    plan_id=plan_id,
                    domain="diagnostics",
                    section="protocol",
                    before_text="Before",
                    after_text="After",
                    rationale="Because this is better.",
                    rating=5,
                ).model_dump()
                feedback_response = client.post("/api/feedback", json=feedback_payload)
                self.assertEqual(feedback_response.status_code, 200)
                self.assertTrue(feedback_response.json()["success"])