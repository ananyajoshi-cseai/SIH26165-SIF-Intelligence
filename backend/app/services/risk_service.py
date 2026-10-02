import re

HAZARD_WEIGHTS: dict[str, float] = {
    "suspended load": 30,
    "confined space": 30,
    "toxic atmosphere": 30,
    "gas leak": 30,
    "pressure release": 30,
    "explosive energy": 30,
    "unguarded rotating machinery": 30,
    "caught-in": 30,
    "caught-between": 30,
    "fall from height": 30,
    "drowning": 30,
    "electrical energy": 30,
    "equipment instability": 25,
    "equipment collapse": 30,
    "drilling equipment": 25,
    "vehicle": 25,
    "mobile equipment": 25,
    "struck-by": 25,
    "marine": 25,
    "oil spill": 15,
    "trip hazard": 5,
}

EXPOSURE_WEIGHTS: dict[str, float] = {
    "line of fire": 1.5,
    "moving equipment": 1.4,
    "hazardous atmosphere": 1.5,
    "fall hazard": 1.5,
    "energized equipment": 1.5,
    "drilling equipment": 1.3,
    "moving object": 1.3,
    "unstable equipment": 1.4,
    "moving vehicle": 1.4,
    "water environment": 1.4,
    "marine environment": 1.3,
    "high-energy well operation": 1.5,
    "inside confined space": 1.5,
    "flammable atmosphere": 1.5,
    "hazardous chemicals": 1.4,
    "extreme heat": 1.2,
    "worker isolated": 0.5,
}

BARRIER_FAILURE_WEIGHTS: dict[str, float] = {
    "loto violation": 30,
    "loto not applied": 30,
    "guard missing": 20,
    "atmospheric testing not completed": 30,
    "no atmospheric test": 30,
    "ppe missing": 10,
    "ppe failure": 10,
    "rigging failure": 30,
    "barrier bypass": 25,
    "exclusion zone breached": 25,
    "exclusion zone breach": 25,
    "loss of containment": 30,
    "fall protection failure": 30,
    "equipment safety control failure": 25,
    "line-of-fire control failure": 25,
    "equipment stability failure": 25,
    "mobile equipment control failure": 25,
    "water safety control failure": 25,
    "marine safety control failure": 25,
    "high-energy control failure": 30,
    "process isolation failure": 30,
    "shoring": 25,
    "grounding": 20,
}

CONSEQUENCE_WEIGHTS: dict[str, float] = {
    "fatality": 30,
    "serious injury": 20,
    "medical treatment": 10,
}

FATIGUE_SIGNAL_WEIGHTS: dict[str, float] = {
    "working_hours": 0.25,
    "consecutive_shifts": 0.25,
    "night_shifts": 0.20,
    "rest_gap_hours": 0.15,
    "self_reported_fatigue": 0.15,
}


def _match_weight(value: str | None, weights: dict[str, float]) -> float:
    if not value:
        return 0
    value_lower = value.lower()
    for keyword, weight in weights.items():
        if keyword in value_lower:
            return weight
    return 0


def get_risk_breakdown(extracted_data: dict) -> dict[str, float]:
    return {
        "hazard": _match_weight(
            extracted_data.get("hazard"),
            HAZARD_WEIGHTS,
        ),
        "exposure": _match_weight(
            extracted_data.get("exposure"),
            EXPOSURE_WEIGHTS,
        ),
        "barrier_failure": _match_weight(
            extracted_data.get("barrier_failure"),
            BARRIER_FAILURE_WEIGHTS,
        ),
        "consequence": _match_weight(
            extracted_data.get("potential_consequence"),
            CONSEQUENCE_WEIGHTS,
        ),
    }


def calculate_risk_score(extracted_data: dict) -> int:
    """
    Deterministic SIF risk score.
    Formula: (hazard_weight × exposure_multiplier) + barrier_failure_weight + consequence_weight
    LLM never touches this calculation.
    """
    hazard_weight = _match_weight(extracted_data.get("hazard"), HAZARD_WEIGHTS)
    exposure_multiplier = _match_weight(extracted_data.get("exposure"), EXPOSURE_WEIGHTS)
    barrier_failure_weight = _match_weight(
        extracted_data.get("barrier_failure"),
        BARRIER_FAILURE_WEIGHTS,
    )
    consequence_weight = _match_weight(
        extracted_data.get("potential_consequence"),
        CONSEQUENCE_WEIGHTS,
    )

    if exposure_multiplier == 0:
        exposure_multiplier = 1.0

    score = (
        (hazard_weight * exposure_multiplier)
        + barrier_failure_weight
        + consequence_weight
    )
    return min(round(score), 100)


def get_sif_level(score: int) -> str:
    if score >= 80:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def calculate_fatigue_score(signals: dict | None) -> int | None:
    if not signals:
        return None

    if signals.get("fatigue_score") is not None:
        try:
            return max(0, min(100, round(float(signals["fatigue_score"]))))
        except (TypeError, ValueError):
            return None

    components: dict[str, float] = {}
    for key, value in signals.items():
        try:
            number = float(value)
        except (TypeError, ValueError):
            if key == "self_reported_fatigue" and isinstance(value, str):
                level = value.strip().lower()
                components[key] = {
                    "low": 25,
                    "moderate": 50,
                    "medium": 50,
                    "high": 75,
                    "very high": 90,
                    "extreme": 100,
                }.get(level, -1)
            continue

        if key == "working_hours":
            components[key] = max(0, min(100, (number - 40) / 32 * 100))
        elif key == "consecutive_shifts":
            components[key] = max(0, min(100, (number - 4) / 8 * 100))
        elif key == "night_shifts":
            components[key] = max(0, min(100, number / 7 * 100))
        elif key == "rest_gap_hours":
            components[key] = max(0, min(100, (12 - number) / 8 * 100))
        elif key == "self_reported_fatigue" and 0 <= number <= 100:
            components[key] = number

    weighted_values = [
        (components[key], weight)
        for key, weight in FATIGUE_SIGNAL_WEIGHTS.items()
        if key in components and components[key] >= 0
    ]
    if not weighted_values:
        return None

    total_weight = sum(weight for _, weight in weighted_values)
    return round(sum(value * weight for value, weight in weighted_values) / total_weight)


def extract_fatigue_signals(text: str) -> dict[str, int | float | str]:
    patterns = {
        "working_hours": r"\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:worked|this roster|per week|in the roster)\b",
        "consecutive_shifts": r"\b(\d+)\s+consecutive\s+shifts?\b",
        "night_shifts": r"\b(\d+)\s+night\s+shifts?\b",
        "rest_gap_hours": r"\b(?:average\s+)?rest(?:\s+gap|\s+period)?\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b",
    }
    signals: dict[str, int | float | str] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            signals[key] = int(value) if value.is_integer() else value

    self_report = re.search(
        r"(?:self[- ]reported\s+)?fatigue(?:\s+level)?\s*[:=-]?\s*(very high|extreme|high|moderate|medium|low)\b",
        text,
        re.IGNORECASE,
    )
    if self_report:
        signals["self_reported_fatigue"] = self_report.group(1).lower()
    return signals


def get_fatigue_level(score: int) -> str:
    if score >= 61:
        return "HIGH"
    if score >= 31:
        return "MEDIUM"
    return "LOW"


def calculate_contextual_risk(
    base_score: int,
    fatigue_score: int | None,
    max_adjustment: int = 8,
) -> dict[str, object]:
    base = max(0, min(100, int(base_score)))
    fatigue = max(0, min(100, int(fatigue_score))) if fatigue_score is not None else None
    result: dict[str, int | str | None] = {
        "base_sif_risk_score": base,
        "base_risk_level": get_sif_level(base),
        "fatigue_score": fatigue,
        "fatigue_level": get_fatigue_level(fatigue) if fatigue is not None else None,
        "fatigue_adjustment": None,
        "contextual_risk_score": None,
        "contextual_risk_level": None,
        "risk_change": None,
    }
    if fatigue is None:
        return result

    # Prototype default: calibrate against historical data and HSE/domain-expert validation.
    proposed_adjustment = round(max(0, max_adjustment) * fatigue / 100)
    adjustment = min(proposed_adjustment, 100 - base)
    contextual = base + adjustment
    result.update(
        {
            "fatigue_adjustment": adjustment,
            "contextual_risk_score": contextual,
            "contextual_risk_level": get_sif_level(contextual),
            "risk_change": contextual - base,
        }
    )
    return result


def calculate_confidence(extracted_data: dict) -> float:
    """
    Confidence = proportion of fields successfully extracted (not 'Unknown').
    Capped at 0.95 — AI is never 100% certain.
    Low confidence triggers HITL manual review recommendation.
    """
    fields = [
        extracted_data.get("activity"),
        extracted_data.get("hazard"),
        extracted_data.get("exposure"),
        extracted_data.get("barrier"),
        extracted_data.get("barrier_failure"),
        extracted_data.get("potential_consequence"),
    ]
    known = sum(
        1 for f in fields
        if f and f.strip().lower() != "unknown"
    )
    return round((known / len(fields)) * 0.95, 2)
