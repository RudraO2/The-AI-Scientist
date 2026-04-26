"""Literature QC — Semantic Scholar + arXiv + Europe PMC, scored by embedding cosine.

Three sources are queried in parallel:
- Semantic Scholar Graph API (broad multidisciplinary)
- arXiv (physics/CS heavy)
- Europe PMC (biology / biomedical, free REST, no key)

Scoring: if an embedder is provided, novelty is decided by the cosine similarity
between the hypothesis embedding and each candidate's title+abstract embedding.
If embedding is unavailable (call fails or no embedder passed), the function
falls back to the original keyword-overlap heuristic so the endpoint never
hard-fails on transient embed errors.
"""
from __future__ import annotations
import math
import os
import asyncio
import xml.etree.ElementTree as ET
from typing import Any, Callable, Optional
import httpx

from schemas import LiteratureQCResult, LiteratureRef, NoveltySignal


SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"
ARXIV_BASE = "https://export.arxiv.org/api/query"
EUROPE_PMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"


async def search_semantic_scholar(query: str, limit: int = 5) -> list[LiteratureRef]:
    """Search Semantic Scholar — works without API key but rate-limited; key recommended."""
    api_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY", "").strip()
    headers = {"x-api-key": api_key} if api_key else {}
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,authors,year,venue,abstract,url,externalIds",
    }
    async with httpx.AsyncClient(timeout=12) as c:
        try:
            r = await c.get(f"{SEMANTIC_SCHOLAR_BASE}/paper/search",
                            params=params, headers=headers)
            r.raise_for_status()
            data = r.json()
        except Exception:
            return []

    refs: list[LiteratureRef] = []
    for p in data.get("data", []):
        refs.append(LiteratureRef(
            title=p.get("title") or "Untitled",
            authors=[a.get("name", "") for a in (p.get("authors") or [])][:5],
            year=p.get("year"),
            venue=p.get("venue"),
            url=p.get("url"),
            abstract=(p.get("abstract") or "")[:600] or None,
        ))
    return refs


async def search_arxiv(query: str, limit: int = 5) -> list[LiteratureRef]:
    """arXiv Atom feed search — free, no key needed."""
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": limit,
        "sortBy": "relevance",
    }
    async with httpx.AsyncClient(timeout=12) as c:
        try:
            r = await c.get(ARXIV_BASE, params=params)
            r.raise_for_status()
        except Exception:
            return []

    refs: list[LiteratureRef] = []
    try:
        root = ET.fromstring(r.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        for entry in root.findall("atom:entry", ns):
            title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
            summary = (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip()
            published = entry.findtext("atom:published", default="", namespaces=ns) or ""
            year = int(published[:4]) if published[:4].isdigit() else None
            url = ""
            for link in entry.findall("atom:link", ns):
                if link.attrib.get("rel") in (None, "alternate"):
                    url = link.attrib.get("href", "")
                    break
            authors = [a.findtext("atom:name", default="", namespaces=ns) or ""
                       for a in entry.findall("atom:author", ns)][:5]
            refs.append(LiteratureRef(
                title=title,
                authors=authors,
                year=year,
                venue="arXiv",
                url=url or None,
                abstract=summary[:600] or None,
            ))
    except Exception:
        return []
    return refs


async def search_europe_pmc(query: str, limit: int = 5) -> list[LiteratureRef]:
    """Europe PMC REST search — biology-heavy, free, no key needed."""
    params = {
        "query": query,
        "format": "json",
        "pageSize": limit,
        "resultType": "core",
    }
    async with httpx.AsyncClient(timeout=12) as c:
        try:
            r = await c.get(EUROPE_PMC_BASE, params=params)
            r.raise_for_status()
            data = r.json()
        except Exception:
            return []

    refs: list[LiteratureRef] = []
    results = (data.get("resultList") or {}).get("result") or []
    for p in results:
        authors_str = p.get("authorString") or ""
        authors = [a.strip() for a in authors_str.split(",") if a.strip()][:5]
        url: Optional[str] = None
        if p.get("doi"):
            url = f"https://doi.org/{p['doi']}"
        elif p.get("pmcid"):
            url = f"https://europepmc.org/article/PMC/{p['pmcid']}"
        elif p.get("pmid"):
            url = f"https://pubmed.ncbi.nlm.nih.gov/{p['pmid']}"
        year: Optional[int] = None
        if p.get("pubYear"):
            try:
                year = int(p["pubYear"])
            except (TypeError, ValueError):
                year = None
        refs.append(LiteratureRef(
            title=p.get("title") or "Untitled",
            authors=authors,
            year=year,
            venue=p.get("journalTitle") or "Europe PMC",
            url=url,
            abstract=(p.get("abstractText") or "")[:600] or None,
        ))
    return refs


def _score_overlap(text: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.0
    text_l = text.lower()
    hits = sum(1 for k in keywords if k.lower() in text_l)
    return hits / len(keywords)


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


Embedder = Callable[[list[str]], Optional[list[list[float]]]]


# Embedding-cosine bands (text-embedding-004 cosine on hypothesis vs title+abstract).
# Calibrated against the four sample hypotheses: an exact-paper duplicate scores
# ~0.85+, a same-domain neighbour scores ~0.65, an unrelated paper scores <0.5.
_EMBED_NOT_FOUND = 0.55
_EMBED_EXACT = 0.85

# Keyword fallback bands (legacy heuristic). Looser since signal is weaker.
_KW_NOT_FOUND = 0.20
_KW_EXACT = 0.85


async def run_literature_qc(*, hypothesis: str, keywords: list[str],
                            embedder: Embedder | None = None) -> LiteratureQCResult:
    """Combine Semantic Scholar + arXiv + Europe PMC. Score via embedding cosine
    when an embedder is provided; fall back to keyword overlap otherwise."""
    query = " ".join(keywords[:5]) if keywords else hypothesis[:200]

    sem_task = asyncio.create_task(search_semantic_scholar(query, limit=5))
    arx_task = asyncio.create_task(search_arxiv(query, limit=5))
    pmc_task = asyncio.create_task(search_europe_pmc(query, limit=5))
    sem_refs, arx_refs, pmc_refs = await asyncio.gather(sem_task, arx_task, pmc_task)

    # Dedupe across sources by lowercased title.
    seen: set[str] = set()
    pool: list[LiteratureRef] = []
    for ref in sem_refs + pmc_refs + arx_refs:
        key = (ref.title or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        pool.append(ref)

    if not pool:
        return LiteratureQCResult(
            novelty="not_found",
            rationale="No prior work surfaced by Semantic Scholar, Europe PMC, or arXiv.",
            references=[],
        )

    scored: list[tuple[float, LiteratureRef]] = []
    method = "keyword"
    if embedder is not None:
        texts = [hypothesis] + [f"{r.title}. {r.abstract or ''}" for r in pool]
        embeds = await asyncio.to_thread(embedder, texts)
        if embeds and len(embeds) == len(texts):
            hyp_vec = embeds[0]
            for ref, vec in zip(pool, embeds[1:]):
                scored.append((_cosine(hyp_vec, vec), ref))
            method = "embedding"

    if method != "embedding":
        for ref in pool:
            haystack = f"{ref.title} {ref.abstract or ''}"
            scored.append((_score_overlap(haystack, keywords), ref))

    scored.sort(key=lambda t: t[0], reverse=True)
    top = scored[:3]

    not_found_t = _EMBED_NOT_FOUND if method == "embedding" else _KW_NOT_FOUND
    exact_t = _EMBED_EXACT if method == "embedding" else _KW_EXACT

    if not top or top[0][0] < not_found_t:
        novelty: NoveltySignal = "not_found"
        rationale = "No closely matching prior work surfaced for this hypothesis."
    elif top[0][0] >= exact_t:
        novelty = "exact_match_found"
        rationale = "A highly overlapping prior study was found — verify novelty before proceeding."
    else:
        novelty = "similar_work_exists"
        rationale = "Related work exists; the proposed experiment appears to extend rather than duplicate it."

    label = "Cosine similarity" if method == "embedding" else "Keyword overlap"
    refs_with_reason = []
    for score, ref in top:
        ref.similarity_reason = f"{label}: {score:.2f}"
        refs_with_reason.append(ref)

    return LiteratureQCResult(
        novelty=novelty,
        rationale=rationale,
        references=refs_with_reason,
    )
