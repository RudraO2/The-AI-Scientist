"""Gemini wrapper using the new google-genai SDK with Pydantic structured output."""
from __future__ import annotations
import os
import json
from google import genai
from google.genai import types

from schemas import ParsedHypothesis, ExperimentPlan
from prompts import (
    PARSE_HYPOTHESIS_SYSTEM,
    GENERATE_PLAN_SYSTEM,
    GENERATE_PLAN_USER_TEMPLATE,
    CORRECTIONS_BLOCK_TEMPLATE,
)


class GeminiClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        api_key = api_key or os.environ["GEMINI_API_KEY"]
        self.model = model or os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
        self.client = genai.Client(api_key=api_key)

    # ---------- Stage 1: parse hypothesis ----------

    def parse_hypothesis(self, hypothesis: str) -> ParsedHypothesis:
        response = self.client.models.generate_content(
            model=self.model,
            contents=hypothesis,
            config=types.GenerateContentConfig(
                system_instruction=PARSE_HYPOTHESIS_SYSTEM,
                response_mime_type="application/json",
                response_schema=ParsedHypothesis,
                temperature=0.2,
            ),
        )
        return ParsedHypothesis.model_validate_json(response.text)

    # ---------- Stage 3: generate full plan ----------

    def generate_plan(
        self,
        *,
        hypothesis: str,
        parsed: ParsedHypothesis,
        qc_summary: str,
        corrections: list[dict] | None = None,
    ) -> ExperimentPlan:
        corrections_block = ""
        if corrections:
            lines = []
            for i, c in enumerate(corrections, 1):
                lines.append(
                    f"{i}. (relevance={c['score']:.2f}) {c['text']}"
                )
            corrections_block = CORRECTIONS_BLOCK_TEMPLATE.format(
                corrections_list="\n".join(lines)
            )

        user_prompt = GENERATE_PLAN_USER_TEMPLATE.format(
            hypothesis=hypothesis,
            parsed_json=parsed.model_dump_json(indent=2),
            qc_summary=qc_summary,
            corrections_block=corrections_block,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=GENERATE_PLAN_SYSTEM,
                response_mime_type="application/json",
                response_schema=ExperimentPlan,
                temperature=0.4,
                max_output_tokens=16384,
            ),
        )
        return ExperimentPlan.model_validate_json(response.text)
