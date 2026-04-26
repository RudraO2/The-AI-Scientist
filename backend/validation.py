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
}

LABOUR_OVERHEAD_FRACTION = 0.20


def looks_like_sku(catalog_number: str | None) -> bool:
    if not catalog_number:
        return False
    return bool(_SKU_SHAPE_RE.match(catalog_number.strip()))


def supplier_recognized(supplier: str) -> bool:
    s = (supplier or "").lower()
    return any(known in s for known in _KNOWN_SUPPLIERS)


def normalize_plan(plan: ExperimentPlan) -> ExperimentPlan:
    """Recompute totals, mark materials verified."""
    for m in plan.materials:
        m.verified = looks_like_sku(m.catalog_number) and supplier_recognized(m.supplier)

    materials_total = round(sum(m.line_total_usd for m in plan.materials), 2)
    plan.total_budget_usd = round(materials_total * (1.0 + LABOUR_OVERHEAD_FRACTION), 2)
    return plan
