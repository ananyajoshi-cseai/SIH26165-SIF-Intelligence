"""
classification_service.py
--------------------------
Report-type and SIF-potential classification for FACT AI.

Two-stage pipeline
~~~~~~~~~~~~~~~~~~
Stage 1 – Report Type
    Near Miss | Unsafe Condition | Unsafe Act
    Rule-based keyword scoring with weighted evidence tiers.

Stage 2 – SIF Potential
    SIF Potential | Non-SIF Potential
    Deterministic rules driven by consequence, hazard, barrier-failure
    and risk score (keeps our existing deterministic engine intact).
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hit_count(text: str, phrases: list[str]) -> int:
    """Return the number of phrases found in *text*."""
    return sum(1 for p in phrases if p in text)


def _any_hit(text: str, phrases: list[str]) -> bool:
    return any(p in text for p in phrases)


# ---------------------------------------------------------------------------
# Stage 1 — Report-Type Classification
# ---------------------------------------------------------------------------

# Tier-1: very strong signals (weight 3)
_NM_STRONG = [
    "near miss", "near-miss", "close call", "narrowly avoided",
    "no injury occurred", "incident was avoided", "potential incident avoided",
    "almost hit", "almost struck", "nearly hit", "nearly struck",
]

# Tier-2: moderate signals (weight 2)
_NM_MODERATE = [
    "no injury", "without injury", "no incident", "potential incident",
    "almost fell", "nearly fell", "barely avoided",
]

_UC_STRONG = [
    "exposed wire", "exposed electrical", "missing guard", "guard missing",
    "guard was missing", "machine guard was missing", "no guard",
    "damaged equipment", "defective equipment", "damaged cable",
    "damaged hose", "broken equipment", "loose connection",
    "unsafe condition", "unsafe setup", "poor lighting",
    "inadequate lighting", "no ppe available", "ppe unavailable",
    "inadequate barricade", "no barricade", "unsecured load",
    "unsecured equipment", "poor housekeeping", "housekeeping was poor",
    "leak detected", "leakage detected", "structural defect",
    "equipment failure", "equipment malfunction",
]

_UC_MODERATE = [
    "leak", "leakage", "unsecured", "defective", "damaged",
    "broken", "missing", "inadequate", "no signage", "slippery surface",
]

_UA_STRONG = [
    "failed to wear", "failed to use", "failed to verify", "failed to check",
    "without wearing ppe", "without using ppe", "without authorization",
    "without verifying isolation", "without checking atmosphere",
    "entered without", "climbed without", "operated without",
    "bypassed", "bypass interlock", "removed the guard", "removed guard",
    "crossed the barricade", "entered the exclusion zone",
    "violated procedure", "violated loto", "ignored safety",
    "did not follow", "didn't follow", "failed to isolate",
    "failed to lock out", "loto not applied", "loto violation",
    "worked without permit", "no permit to work", "ptw not obtained",
]

_UA_MODERATE = [
    "failed to", "did not", "didn't", "without wearing", "without using",
    "without verifying", "without checking", "without authorization",
    "ignored", "violated", "attempted to", "worker entered",
    "employee entered", "worker climbed", "employee climbed",
    "worker operated", "employee operated",
]


def classify_report_type(text: str) -> tuple[str, float]:
    """
    Classify report text into Near Miss / Unsafe Condition / Unsafe Act.

    Returns
    -------
    (report_type, confidence)  where confidence ∈ [0.0, 0.98]
    """
    text = (text or "").lower().strip()

    if not text:
        return "Unsafe Condition", 0.30

    # Weighted scoring: strong hit = 3 pts, moderate hit = 1 pt
    scores: dict[str, float] = {
        "Near Miss": (
            _hit_count(text, _NM_STRONG) * 3
            + _hit_count(text, _NM_MODERATE) * 1
        ),
        "Unsafe Condition": (
            _hit_count(text, _UC_STRONG) * 3
            + _hit_count(text, _UC_MODERATE) * 1
        ),
        "Unsafe Act": (
            _hit_count(text, _UA_STRONG) * 3
            + _hit_count(text, _UA_MODERATE) * 1
        ),
    }

    best_type = max(scores, key=scores.__getitem__)
    best_score = scores[best_type]
    total_score = sum(scores.values()) or 1

    if best_score == 0:
        # No signals found — default to Unsafe Condition with low confidence
        return "Unsafe Condition", 0.38

    # Confidence = how dominant the winner is, scaled to [0.55, 0.98]
    dominance = best_score / total_score          # 0.33 … 1.0
    raw_conf = 0.55 + dominance * 0.43            # 0.55 … 0.98
    confidence = round(min(raw_conf, 0.98), 2)

    return best_type, confidence


# ---------------------------------------------------------------------------
# Stage 2 — SIF-Potential Classification
# ---------------------------------------------------------------------------

_SIF_HAZARDS = [
    "fall from height", "confined space", "toxic atmosphere",
    "electrical energy", "suspended load", "caught-in", "caught-between",
    "equipment collapse", "equipment instability", "pressure release",
    "explosive energy", "struck-by", "vehicle", "mobile equipment",
    "high-energy", "drowning", "fire", "explosion", "gas leak",
    "hydrocarbon", "well control", "blowout",
]

_SIF_BARRIER_FAILURES = [
    "fall protection", "loto", "atmospheric testing", "rigging failure",
    "barrier bypass", "exclusion zone", "loss of containment",
    "process isolation", "high-energy", "line-of-fire",
    "grounding", "bonding", "electrical isolation",
]

_NON_SIF_CONSEQUENCES = [
    "minor cut", "minor bruise", "minor abrasion", "first aid",
    "near miss", "no injury", "property damage only",
]


def classify_sif_potential(
    report_type: str,
    risk_score: int,
    extraction: dict,
) -> tuple[str, float]:
    """
    Classify whether the incident is SIF Potential or Non-SIF Potential.

    Kept fully deterministic so it does not conflict with the existing
    risk-scoring engine.  Both outputs (risk_score and sif_potential) are
    shown separately on the dashboard.

    Returns
    -------
    (sif_potential, confidence)  where confidence ∈ [0.0, 0.98]
    """
    consequence = str(extraction.get("potential_consequence") or "").lower()
    hazard = str(extraction.get("hazard") or "").lower()
    barrier_failure = str(extraction.get("barrier_failure") or "").lower()

    # --- Definite SIF --------------------------------------------------
    if consequence == "fatality":
        return "SIF Potential", 0.97

    if consequence == "serious injury":
        return "SIF Potential", 0.94

    if risk_score >= 80:
        return "SIF Potential", 0.92

    # --- Strong SIF signals --------------------------------------------
    if _any_hit(hazard, _SIF_HAZARDS):
        # Scale confidence by risk score
        conf = round(min(0.78 + (risk_score / 1000), 0.90), 2)
        return "SIF Potential", conf

    if _any_hit(barrier_failure, _SIF_BARRIER_FAILURES):
        conf = round(min(0.75 + (risk_score / 1000), 0.88), 2)
        return "SIF Potential", conf

    # --- Near Miss with elevated risk ----------------------------------
    if report_type == "Near Miss" and risk_score >= 40:
        return "SIF Potential", 0.76

    # --- Explicit Non-SIF signals -------------------------------------
    if _any_hit(consequence, _NON_SIF_CONSEQUENCES):
        return "Non-SIF Potential", 0.85

    if risk_score < 20:
        return "Non-SIF Potential", 0.80

    # --- Default: moderate risk, classify as Non-SIF with low confidence
    return "Non-SIF Potential", 0.62
