HAZARD_SEVERITY = {
    # Critical SIF hazards
    "suspended load": 35,
    "confined space": 35,
    "toxic atmosphere": 35,
    "gas leak": 35,
    "pressure release": 35,
    "explosive energy": 35,
    "unguarded rotating machinery": 35,
    "caught-in": 35,
    "caught-between": 35,
    "fall from height": 35,
    "drowning": 35,
    "equipment collapse": 35,
    "electrical energy": 35,

    # High hazards
    "equipment instability": 30,
    "drilling equipment": 30,
    "vehicle": 30,
    "mobile equipment": 30,
    "struck-by": 30,
    "marine": 30,

    # Lower-severity hazards
    "oil spill": 15,
    "trip hazard": 5,
}

EXPOSURE_SEVERITY = {
    "line of fire": 20,
    "moving equipment": 18,
    "hazardous atmosphere": 20,
    "fall hazard": 20,
    "energized equipment": 20,
    "drilling equipment": 16,
    "moving object": 16,
    "unstable equipment": 18,
    "moving vehicle": 18,
    "water environment": 18,
    "marine environment": 16,
    "high-energy well operation": 20,
    "worker isolated": 5,
}

BARRIER_FAILURE_SEVERITY = {
    "loto violation": 30,
    "guard missing": 20,
    "atmospheric testing not completed": 30,
    "ppe missing": 10,
    "rigging failure": 30,
    "barrier bypass": 25,
    "loss of containment": 30,
    "fall protection failure": 30,
    "equipment safety control failure": 25,
    "line-of-fire control failure": 25,
    "equipment stability failure": 25,
    "mobile equipment control failure": 25,
    "water safety control failure": 25,
    "marine safety control failure": 25,
    "high-energy control failure": 30,
}

CONSEQUENCE_SEVERITY = {
    "fatality": 15,
    "serious injury": 12,
    "medical treatment": 7,
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
            HAZARD_SEVERITY,
        ),
        "exposure": _match_weight(
            extracted_data.get("exposure"),
            EXPOSURE_SEVERITY,
        ),
        "barrier_failure": _match_weight(
            extracted_data.get("barrier_failure"),
            BARRIER_FAILURE_SEVERITY,
        ),
        "consequence": _match_weight(
            extracted_data.get("potential_consequence"),
            CONSEQUENCE_SEVERITY,
        ),
    }


def calculate_risk_score(extracted_data: dict) -> int:
    """
    Calculate the SIF risk score deterministically using an
    explainable additive 0-100 model.

    The LLM/NLP extractor provides structured safety information,
    but never determines the final risk score.

    Components:
    - Hazard severity: 0-35
    - Exposure severity: 0-20
    - Barrier failure severity: 0-30
    - Potential consequence: 0-15
    """
    breakdown = get_risk_breakdown(extracted_data)
    score = sum(breakdown.values())

    return min(round(score), 100)


def get_sif_level(score: int) -> str:
    if score >= 80:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"
