"""HydraDB wrapper — thin layer over the official SDK for ingest + recall of scientist corrections.

Design notes:
- HydraDB add_memory has no native metadata filter we can rely on, so we encode `[domain]` and a
  structured tag block at the start of each memory text. recall_preferences uses semantic search
  over body, which means the domain string in body acts as both signal and filter.
- We use recall_preferences (not full_recall) because in our smoke test full_recall returned 0
  chunks while recall_preferences returned the right hits.
"""
from __future__ import annotations
import logging
import os
import time
from typing import Any
from hydra_db import HydraDB

logger = logging.getLogger(__name__)

_TENANT_READY: dict[str, bool] = {}


class HydraClient:
    def __init__(self, api_key: str | None = None, tenant_id: str | None = None,
                 sub_tenant_id: str | None = None) -> None:
        api_key = api_key or os.environ["HYDRADB_API_KEY"]
        self.tenant_id = tenant_id or os.environ.get("HYDRA_TENANT_ID", "ai-scientist")
        self.sub_tenant_id = sub_tenant_id or os.environ.get("HYDRA_SUB_TENANT_ID", "default")
        self.client = HydraDB(token=api_key)

    def ensure_tenant(self, max_wait_seconds: float = 60.0) -> None:
        """Idempotently provision the tenant and wait for vectorstore to be ready."""
        if _TENANT_READY.get(self.tenant_id):
            return
        try:
            self.client.tenant.create(tenant_id=self.tenant_id)
        except Exception as e:
            logger.debug("Tenant create skipped (likely already exists): %s", e)

        deadline = time.time() + max_wait_seconds
        while time.time() < deadline:
            try:
                status = self.client.tenant.get_infra_status(tenant_id=self.tenant_id)
                vs = status.infra.vectorstore_status
                if all(vs):
                    _TENANT_READY[self.tenant_id] = True
                    return
            except Exception:
                pass
            time.sleep(2)
        raise TimeoutError(f"HydraDB tenant {self.tenant_id} not ready after {max_wait_seconds}s")

    def ingest_correction(self, *, domain: str, section: str, before_text: str,
                          after_text: str, rationale: str,
                          rating: int | None = None,
                          annotation: str | None = None) -> str:
        """Store a scientist correction. Returns source_id."""
        # Ingest is a write operation — we DO want to wait longer for the tenant to be ready,
        # because dropping a correction silently would defeat the whole feedback loop.
        self.ensure_tenant(max_wait_seconds=120.0)
        body = self._format_correction_body(
            domain=domain, section=section,
            before_text=before_text, after_text=after_text, rationale=rationale,
            rating=rating, annotation=annotation,
        )
        result = self.client.upload.add_memory(
            memories=[{"text": body, "infer": True}],
            tenant_id=self.tenant_id,
            sub_tenant_id=self.sub_tenant_id,
            upsert=True,
        )
        if not result.success or not result.results:
            raise RuntimeError(f"HydraDB ingest failed: {result.message}")
        return result.results[0].source_id

    def recall_corrections(self, *, query: str, domain: str | None = None,
                           top_k: int = 5) -> list[dict[str, Any]]:
        """Semantic search past corrections. Returns list of {text, score, source_id}.
        If the tenant is still provisioning or recall fails, returns [] so the caller can
        proceed without memory rather than fail the request."""
        try:
            self.ensure_tenant(max_wait_seconds=5.0)
        except Exception:
            return []
        weighted_query = f"[domain:{domain}] {query}" if domain else query
        try:
            res = self.client.recall.recall_preferences(
                query=weighted_query,
                tenant_id=self.tenant_id,
                sub_tenant_id=self.sub_tenant_id,
            )
        except Exception:
            return []

        hits: list[dict[str, Any]] = []
        for chunk in (res.chunks or [])[:top_k]:
            hits.append({
                "text": chunk.chunk_content,
                "score": float(chunk.relevancy_score or 0.0),
                "source_id": chunk.source_id,
            })
        return hits

    @staticmethod
    def _format_correction_body(*, domain: str, section: str,
                                before_text: str, after_text: str, rationale: str,
                                rating: int | None = None,
                                annotation: str | None = None) -> str:
        parts = [
            f"[domain:{domain}] [section:{section}]",
        ]
        if rating is not None:
            parts.append(f"[rating:{rating}/5]")
        parts.append("Scientist correction.")
        def _sanitize(s: str, limit: int = 400) -> str:
            return s.strip()[:limit].replace("|", "｜")

        if before_text.strip() != after_text.strip():
            parts.append(f"Original: {_sanitize(before_text)} |")
            parts.append(f"Corrected to: {_sanitize(after_text)} |")
        else:
            parts.append(f"Text: {_sanitize(before_text)} |")
        if rationale.strip():
            parts.append(f"Reason: {_sanitize(rationale)}")
        if annotation and annotation.strip():
            parts.append(f"Note: {_sanitize(annotation)}")
        return " ".join(parts)
