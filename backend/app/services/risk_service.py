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
