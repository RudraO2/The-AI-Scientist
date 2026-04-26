"""Server-side plan post-processors.

Budget is recomputed from material line totals so the LLM cannot publish a
total that disagrees with its own line items. Catalog numbers are shape-checked
against a regex + a list of recognised suppliers so the UI can mark obviously
fabricated SKUs as unverified. We deliberately do NOT call supplier APIs here
because that would add seconds-per-material to plan generation; the brief asks
for a fast first draft, not catalog certification.
"""
from __future__ import annotations
import re
from urllib.parse import quote_plus

from schemas import ExperimentPlan


_SKU_SHAPE_RE = re.compile(r"^[A-Z0-9][A-Z0-9.\-/]{2,19}$")

_KNOWN_SUPPLIERS = {
    "sigma", "sigma-aldrich", "millipore", "merck",
    "thermo", "thermo fisher", "thermofisher", "invitrogen", "gibco",
    "applied biosystems",
    "neb", "new england biolabs",
    "promega", "qiagen", "idt", "integrated dna technologies",
    "addgene", "atcc", "bio-rad", "biorad",
    "abcam", "cell signaling", "cst", "santa cruz",
    "vwr", "fisher scientific", "takara", "roche",
    "dsmz", "jackson laboratory", "jackson labs",
    "r&d systems", "greiner", "greiner bio-one",
    "innovative research", "nexcelom",
    "metrohm", "dropsens", "gamry", "pine instrument", "biologic", "bio-logic",
    "basi", "fuel cell store", "airgas",
}

LABOUR_OVERHEAD_FRACTION = 0.20


def looks_like_sku(catalog_number: str | None) -> bool:
    if not catalog_number:
        return False
    return bool(_SKU_SHAPE_RE.match(catalog_number.strip()))


def supplier_recognized(supplier: str) -> bool:
    s = (supplier or "").lower()
    return any(known in s for known in _KNOWN_SUPPLIERS)


_SUPPLIER_SEARCH_URL: dict[str, str] = {
    "sigma-aldrich": "https://www.sigmaaldrich.com/US/en/search/{q}",
    "sigma": "https://www.sigmaaldrich.com/US/en/search/{q}",
    "millipore": "https://www.sigmaaldrich.com/US/en/search/{q}",
    "merck": "https://www.sigmaaldrich.com/US/en/search/{q}",
    "thermo fisher": "https://www.thermofisher.com/search/results?query={q}",
    "thermofisher": "https://www.thermofisher.com/search/results?query={q}",
    "thermo": "https://www.thermofisher.com/search/results?query={q}",
    "invitrogen": "https://www.thermofisher.com/search/results?query={q}",
    "gibco": "https://www.thermofisher.com/search/results?query={q}",
    "applied biosystems": "https://www.thermofisher.com/search/results?query={q}",
    "fisher scientific": "https://www.fishersci.com/us/en/catalog/search/products?keyword={q}",
    "neb": "https://www.neb.com/en-us/search?q={q}",
    "new england biolabs": "https://www.neb.com/en-us/search?q={q}",
    "promega": "https://www.promega.com/search/?searchTerm={q}",
    "qiagen": "https://www.qiagen.com/us/search?q={q}",
    "idt": "https://www.idtdna.com/search?keyword={q}",
    "integrated dna technologies": "https://www.idtdna.com/search?keyword={q}",
    "addgene": "https://www.addgene.org/search/catalog/plasmids/?q={q}",
    "atcc": "https://www.atcc.org/search#q={q}",
    "bio-rad": "https://www.bio-rad.com/en-us/search?text={q}",
    "biorad": "https://www.bio-rad.com/en-us/search?text={q}",
    "abcam": "https://www.abcam.com/en-us/search?keywords={q}",
    "cell signaling": "https://www.cellsignal.com/search?Ntt={q}",
    "cst": "https://www.cellsignal.com/search?Ntt={q}",
    "santa cruz": "https://www.scbt.com/scbt/search?Ntt={q}",
    "vwr": "https://us.vwr.com/store/search?keyword={q}",
    "takara": "https://www.takarabio.com/search?text={q}",
    "roche": "https://www.sigmaaldrich.com/US/en/search/{q}",
    "r&d systems": "https://www.rndsystems.com/search?keywords={q}",
    "jackson laboratory": "https://www.jax.org/jax-mice-and-services/search?text={q}",
    "jackson labs": "https://www.jax.org/jax-mice-and-services/search?text={q}",
}


def supplier_search_url(supplier: str, query: str) -> str | None:
    s = (supplier or "").lower().strip()
    for key, template in _SUPPLIER_SEARCH_URL.items():
        if key in s:
            return template.format(q=quote_plus(query))
    return None


_SUPPLIER_DOMAINS: dict[str, tuple[str, ...]] = {
    "sigma": ("sigmaaldrich.com", "merckmillipore.com", "merck.com"),
    "sigma-aldrich": ("sigmaaldrich.com", "merckmillipore.com", "merck.com"),
    "millipore": ("sigmaaldrich.com", "merckmillipore.com", "merck.com"),
    "merck": ("sigmaaldrich.com", "merckmillipore.com", "merck.com"),
    "thermo": ("thermofisher.com", "fishersci.com", "lifetechnologies.com"),
    "thermo fisher": ("thermofisher.com", "fishersci.com", "lifetechnologies.com"),
    "thermofisher": ("thermofisher.com", "fishersci.com", "lifetechnologies.com"),
    "invitrogen": ("thermofisher.com", "fishersci.com"),
    "gibco": ("thermofisher.com", "fishersci.com"),
    "applied biosystems": ("thermofisher.com",),
    "fisher scientific": ("fishersci.com", "thermofisher.com"),
    "neb": ("neb.com",),
    "new england biolabs": ("neb.com",),
    "promega": ("promega.com",),
    "qiagen": ("qiagen.com",),
    "idt": ("idtdna.com",),
    "integrated dna technologies": ("idtdna.com",),
    "addgene": ("addgene.org",),
    "atcc": ("atcc.org",),
    "bio-rad": ("bio-rad.com",),
    "biorad": ("bio-rad.com",),
    "abcam": ("abcam.com",),
    "cell signaling": ("cellsignal.com",),
    "cst": ("cellsignal.com",),
    "santa cruz": ("scbt.com",),
    "vwr": ("vwr.com",),
    "takara": ("takarabio.com",),
    "roche": ("sigmaaldrich.com", "roche.com"),
    "r&d systems": ("rndsystems.com",),
    "jackson laboratory": ("jax.org",),
    "jackson labs": ("jax.org",),
}


def url_matches_supplier(url: str, supplier: str) -> bool:
    s = (supplier or "").lower().strip()
    u = (url or "").lower()
    for key, domains in _SUPPLIER_DOMAINS.items():
        if key in s:
            return any(d in u for d in domains)
    return False


def _looks_like_url(s: str | None) -> bool:
    return bool(s) and s.lower().startswith(("http://", "https://"))


def normalize_plan(plan: ExperimentPlan) -> ExperimentPlan:
    """Recompute totals, mark materials verified, attach purchase URLs."""
    for m in plan.materials:
        m.verified = looks_like_sku(m.catalog_number) and supplier_recognized(m.supplier)
        # Drop fabricated/relative URLs; fall back to a supplier search URL.
        if not _looks_like_url(m.purchase_url):
            m.purchase_url = None
        if not m.purchase_url:
            query = m.catalog_number or m.name
            if query:
                m.purchase_url = supplier_search_url(m.supplier, query)

        # Recompute line_total from quantity × unit_cost when the model's value is clearly off.
        # Only correct it when we can parse a leading numeric quantity (e.g. "100", "100 mL").
        qty_match = re.match(r"\s*([0-9]*\.?[0-9]+)", m.quantity or "")
        if qty_match:
            qty = float(qty_match.group(1))
            expected = round(qty * m.unit_cost_usd, 2)
            if expected > 0 and abs(m.line_total_usd - expected) > max(0.05 * expected, 0.5):
                m.line_total_usd = expected

    materials_total = round(sum(m.line_total_usd for m in plan.materials), 2)
    plan.total_budget_usd = round(materials_total * (1.0 + LABOUR_OVERHEAD_FRACTION), 2)
    return plan
