"""Gemini wrapper using the new google-genai SDK with Pydantic structured output."""
from __future__ import annotations
import os
import random
import re
import time
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
        self.fallback_model = os.environ.get("GEMINI_FALLBACK_MODEL", "").strip() or None
        fallback_models_env = os.environ.get("GEMINI_FALLBACK_MODELS", "").strip()
        self.fallback_models = [m.strip() for m in fallback_models_env.split(",") if m.strip()]
        self.max_retries = max(0, int(os.environ.get("GEMINI_MAX_RETRIES", "2")))
        self.base_delay_seconds = max(1.0, float(os.environ.get("GEMINI_RETRY_BASE_SECONDS", "2")))
        self.max_delay_seconds = max(1.0, float(os.environ.get("GEMINI_MAX_RETRY_DELAY_SECONDS", "60")))
        self.client = genai.Client(api_key=api_key)

    def _extract_retry_delay(self, message: str) -> float | None:
        # Gemini errors often include RetryInfo as either "44s" or "44.4s".
        m = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s", message, flags=re.IGNORECASE)
        if m:
            return float(m.group(1))
        m = re.search(r"retry in\s+(\d+(?:\.\d+)?)s", message, flags=re.IGNORECASE)
        if m:
            return float(m.group(1))
        return None

    @staticmethod
    def is_rate_limit_error(exc: Exception) -> bool:
        code = getattr(exc, "code", None)
        if code == 429:
            return True
        msg = str(exc)
        return "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower() or "rate" in msg.lower()

    def _is_rate_limited(self, exc: Exception) -> bool:
        return self.is_rate_limit_error(exc)

    def _retry_delay(self, attempt: int, exc: Exception) -> float:
        hinted = self._extract_retry_delay(str(exc))
        if hinted is not None:
            return min(self.max_delay_seconds, hinted)
        # Exponential backoff with small jitter to avoid herd retries.
        delay = self.base_delay_seconds * (2 ** attempt) + random.uniform(0, 0.5)
        return min(self.max_delay_seconds, delay)

    def _generate_with_retry(self, *, contents: str, config: types.GenerateContentConfig):
        models_to_try: list[str] = [self.model]
        if self.fallback_model:
            models_to_try.append(self.fallback_model)
        models_to_try.extend(self.fallback_models)
        # Safe defaults so a model-specific free-tier quota does not block all traffic.
        models_to_try.extend([
            "gemini-3.1-flash-lite-preview",
            "gemini-2.5-flash",
        ])
        seen: set[str] = set()
        models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

        last_exc: Exception | None = None
        for model_name in models_to_try:
            for attempt in range(self.max_retries + 1):
                try:
                    return self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                    )
                except Exception as exc:
                    last_exc = exc
                    if not self._is_rate_limited(exc):
                        raise
                    if attempt >= self.max_retries:
                        break
                    time.sleep(self._retry_delay(attempt, exc))

        # Preserve the original exception context if all retries fail.
        if last_exc is not None:
            raise last_exc
        raise RuntimeError("Gemini request failed without an exception")

    # ---------- Stage 1: parse hypothesis ----------

    def parse_hypothesis(self, hypothesis: str) -> ParsedHypothesis:
        response = self._generate_with_retry(
            contents=hypothesis,
            config=types.GenerateContentConfig(
                system_instruction=PARSE_HYPOTHESIS_SYSTEM,
                response_mime_type="application/json",
                response_schema=ParsedHypothesis,
                temperature=0.2,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned empty response (possible safety block)")
        return ParsedHypothesis.model_validate_json(response.text)

    # ---------- Embeddings (literature QC novelty scoring) ----------

    def embed_texts(self, texts: list[str]) -> list[list[float]] | None:
        """Embed a batch of texts. Returns None on failure so the caller can fall back."""
        if not texts:
            return []
        model = os.environ.get("GEMINI_EMBED_MODEL", "text-embedding-004")
        try:
            resp = self.client.models.embed_content(model=model, contents=texts)
        except Exception:
            return None
        out: list[list[float]] = []
        for e in (resp.embeddings or []):
            vals = getattr(e, "values", None) or []
            out.append(list(vals))
        if len(out) != len(texts):
            return None
        return out

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

        response = self._generate_with_retry(
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=GENERATE_PLAN_SYSTEM,
                response_mime_type="application/json",
                response_schema=ExperimentPlan,
                temperature=0.4,
                max_output_tokens=16384,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned empty response (possible safety block)")
        return ExperimentPlan.model_validate_json(response.text)
