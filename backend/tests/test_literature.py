from __future__ import annotations
import asyncio
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

import literature
from literature import _cosine, run_literature_qc
from schemas import LiteratureRef


class CosineTests(IsolatedAsyncioTestCase):
    def test_cosine_identical_vectors(self) -> None:
        self.assertAlmostEqual(_cosine([1.0, 0.0], [1.0, 0.0]), 1.0)

    def test_cosine_orthogonal(self) -> None:
        self.assertAlmostEqual(_cosine([1.0, 0.0], [0.0, 1.0]), 0.0)

    def test_cosine_handles_empty(self) -> None:
        self.assertEqual(_cosine([], [1.0]), 0.0)
        self.assertEqual(_cosine([0.0, 0.0], [1.0, 1.0]), 0.0)


def _ref(title: str, abstract: str = "") -> LiteratureRef:
    return LiteratureRef(title=title, authors=[], year=2024, venue="x",
                         url=None, abstract=abstract)


class NoveltyTests(IsolatedAsyncioTestCase):
    async def test_no_results_returns_not_found(self) -> None:
        async def empty(*a, **k): return []
        with (
            patch.object(literature, "search_semantic_scholar", side_effect=empty),
            patch.object(literature, "search_arxiv", side_effect=empty),
            patch.object(literature, "search_europe_pmc", side_effect=empty),
        ):
            result = await run_literature_qc(hypothesis="x", keywords=["x"])
        self.assertEqual(result.novelty, "not_found")
        self.assertEqual(result.references, [])

    async def test_embedder_drives_exact_match(self) -> None:
        async def sem(*a, **k):
            return [_ref("Highly overlapping prior study", "near identical hypothesis")]
        async def empty(*a, **k): return []

        # Hypothesis vector colinear with first ref vector => cosine = 1.0 => exact_match.
        def fake_embedder(texts):
            return [[1.0, 0.0]] * len(texts)

        with (
            patch.object(literature, "search_semantic_scholar", side_effect=sem),
            patch.object(literature, "search_arxiv", side_effect=empty),
            patch.object(literature, "search_europe_pmc", side_effect=empty),
        ):
            result = await run_literature_qc(
                hypothesis="some hypothesis", keywords=["x"], embedder=fake_embedder,
            )
        self.assertEqual(result.novelty, "exact_match_found")
        self.assertEqual(len(result.references), 1)
        self.assertIn("Cosine", result.references[0].similarity_reason or "")

    async def test_embedder_failure_falls_back_to_keywords(self) -> None:
        async def sem(*a, **k):
            return [_ref("Lactobacillus rhamnosus tight junction study",
                         "Lactobacillus rhamnosus GG strengthens claudin-1 expression")]
        async def empty(*a, **k): return []

        def broken_embedder(texts):
            return None  # simulate API failure

        with (
            patch.object(literature, "search_semantic_scholar", side_effect=sem),
            patch.object(literature, "search_arxiv", side_effect=empty),
            patch.object(literature, "search_europe_pmc", side_effect=empty),
        ):
            result = await run_literature_qc(
                hypothesis="probiotic gut",
                keywords=["lactobacillus", "claudin", "rhamnosus"],
                embedder=broken_embedder,
            )
        self.assertIn(result.novelty, {"similar_work_exists", "exact_match_found"})
        self.assertIn("Keyword overlap", result.references[0].similarity_reason or "")

    async def test_dedupe_across_sources(self) -> None:
        async def sem(*a, **k): return [_ref("Same Title", "abs")]
        async def arx(*a, **k): return [_ref("same title", "abs")]
        async def pmc(*a, **k): return [_ref("SAME TITLE", "abs")]

        with (
            patch.object(literature, "search_semantic_scholar", side_effect=sem),
            patch.object(literature, "search_arxiv", side_effect=arx),
            patch.object(literature, "search_europe_pmc", side_effect=pmc),
        ):
            result = await run_literature_qc(hypothesis="x", keywords=["x"])
        self.assertEqual(len(result.references), 1)
