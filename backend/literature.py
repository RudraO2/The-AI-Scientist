"""Literature QC — Semantic Scholar Graph API + arXiv fallback.

Returns a novelty signal and up to 3 most relevant references.
"""
from __future__ import annotations
import os
import asyncio
import xml.etree.ElementTree as ET
from typing import Any
import httpx

from schemas import LiteratureQCResult, LiteratureRef, NoveltySignal


SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"
ARXIV_BASE = "http://export.arxiv.org/api/query"


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


def _score_overlap(text: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.0
    text_l = text.lower()
    hits = sum(1 for k in keywords if k.lower() in text_l)
    return hits / len(keywords)


async def run_literature_qc(*, hypothesis: str, keywords: list[str]) -> LiteratureQCResult:
    """Combine Semantic Scholar + arXiv. Decide novelty by keyword overlap on title+abstract."""
    query = " ".join(keywords[:5]) if keywords else hypothesis[:200]

    semantic_task = asyncio.create_task(search_semantic_scholar(query, limit=5))
    arxiv_task = asyncio.create_task(search_arxiv(query, limit=5))
    sem_refs, arx_refs = await asyncio.gather(semantic_task, arxiv_task)

    # Score and merge
    candidates: list[tuple[float, LiteratureRef]] = []
    for ref in sem_refs + arx_refs:
        haystack = f"{ref.title} {ref.abstract or ''}"
        score = _score_overlap(haystack, keywords)
        candidates.append((score, ref))

    candidates.sort(key=lambda t: t[0], reverse=True)
    top = candidates[:3]

    # Novelty heuristic
    if not top or top[0][0] < 0.20:
        novelty: NoveltySignal = "not_found"
        rationale = "No closely matching prior work surfaced for the keyword set."
    elif top[0][0] >= 0.85:
        novelty = "exact_match_found"
        rationale = "A highly overlapping prior study was found — verify novelty before proceeding."
    else:
        novelty = "similar_work_exists"
        rationale = "Related work exists; the proposed experiment appears to extend rather than duplicate it."

    refs_with_reason = []
    for score, ref in top:
        ref.similarity_reason = f"Keyword overlap score: {score:.2f}"
        refs_with_reason.append(ref)

    return LiteratureQCResult(
        novelty=novelty,
        rationale=rationale,
        references=refs_with_reason,
    )
