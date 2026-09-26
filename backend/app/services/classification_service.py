from __future__ import annotations


REPORT_TYPES = ("Near Miss", "Unsafe Condition", "Unsafe Act")


def _contains_any(text: str, phrases: list[str]) -> bool:
    return any(phrase in text for phrase in phrases)


def classify_report_type(text: str) -> tuple[str, float]:
    text = (text or "").lower().strip()

    if not text:
        return "Unsafe Condition", 0.30

    near_miss_patterns = [
        "near miss",
        "near-miss",
        "near miss incident",
        "almost hit",
        "almost struck",
        "nearly hit",
        "nearly struck",
        "narrowly avoided",
        "close call",
        "no injury",
        "without injury",
        "no incident",
        "incident was avoided",
        "potential incident",
    ]

    unsafe_condition_patterns = [
        "exposed wire",
        "exposed electrical",
        "missing guard",
        "guard missing",
        "guard was missing",
        "machine guard was missing",
        "no guard",
        "poor housekeeping",
        "housekeeping was poor",
        "inadequate barricade",
        "no barricade",
        "damaged equipment",
        "defective equipment",
        "damaged cable",
        "damaged hose",
        "leak",
        "leakage",
        "unsafe condition",
        "unsafe setup",
        "poor lighting",
        "inadequate lighting",
        "no ppe available",
        "ppe unavailable",
        "broken equipment",
        "loose connection",
        "unsecured",
    ]

    unsafe_act_patterns = [
        "failed to",
        "did not",
        "didn't",
        "without wearing",
        "without using",
        "without verifying",
        "without checking",
        "without authorization",
        "ignored",
        "entered",
        "climbed",
        "operated",
        "attempted to",
        "worker entered",
        "employee entered",
        "worker climbed",
        "employee climbed",
        "worker operated",
        "employee operated",
        "violated",
        "bypassed",
        "bypass",
        "removed the guard",
        "removed guard",
        "crossed the barricade",
        "entered the exclusion zone",
    ]

    scores = {
        "Near Miss": sum(
            1 for phrase in near_miss_patterns if phrase in text
        ),
        "Unsafe Condition": sum(
            1 for phrase in unsafe_condition_patterns if phrase in text
        ),
        "Unsafe Act": sum(
            1 for phrase in unsafe_act_patterns if phrase in text
        ),
    }

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if best_score == 0:
        return "Unsafe Condition", 0.40

    confidence = min(0.95, 0.60 + (best_score * 0.10))

    return best_type, round(confidence, 2)


def classify_sif_potential(
    report_type: str,
    risk_score: int,
    extraction: dict,
) -> tuple[str, float]:
    consequence = str(
        extraction.get("potential_consequence") or ""
    ).lower()

    hazard = str(
        extraction.get("hazard") or ""
    ).lower()

    barrier_failure = str(
        extraction.get("barrier_failure") or ""
    ).lower()

    if consequence == "fatality":
        return "SIF Potential", 0.95

    if consequence == "serious injury":
        return "SIF Potential", 0.92

    if risk_score >= 80:
        return "SIF Potential", 0.90

    sif_hazards = [
        "fall from height",
        "confined space",
        "toxic atmosphere",
        "electrical energy",
        "suspended load",
        "caught-in",
        "caught-between",
        "equipment collapse",
        "pressure release",
        "explosive energy",
        "struck-by",
        "vehicle",
        "mobile equipment",
        "high-energy",
    ]

    if _contains_any(hazard, sif_hazards):
        return "SIF Potential", 0.85

    sif_barrier_failures = [
        "fall protection",
        "loto",
        "atmospheric testing",
        "rigging failure",
        "barrier bypass",
        "exclusion zone",
        "loss of containment",
        "process isolation",
        "high-energy",
        "line-of-fire",
    ]

    if _contains_any(barrier_failure, sif_barrier_failures):
        return "SIF Potential", 0.82

    if report_type == "Near Miss" and risk_score >= 40:
        return "SIF Potential", 0.78

    return "Non-SIF Potential", 0.80
