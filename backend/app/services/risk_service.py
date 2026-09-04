HAZARD_WEIGHTS = {
    "suspended load": 30,
    "confined space": 30,
    "toxic atmosphere": 30,
    "unguarded rotating machinery": 30,
    "oil spill": 15,
    "trip hazard": 5,
}

EXPOSURE_WEIGHTS = {
    "line of fire": 1.5,
    "worker isolated": 0.5,
}

BARRIER_FAILURE_WEIGHTS = {
    "loto violation": 30,
    "guard missing": 20,
    "atmospheric testing not completed": 30,
    "ppe missing": 10,
}

CONSEQUENCE_WEIGHTS = {
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


def calculate_risk_score(extracted_data: dict) -> int:
    """
    Calculate the SIF risk score deterministically.

    The LLM/NLP extractor provides structured safety information,
    but never determines the final risk score.
    """

    hazard_weight = _match_weight(
        extracted_data.get("hazard"),
        HAZARD_WEIGHTS,
    )

    exposure_weight = _match_weight(
        extracted_data.get("exposure"),
        EXPOSURE_WEIGHTS,
    )

    barrier_failure_weight = _match_weight(
        extracted_data.get("barrier_failure"),
        BARRIER_FAILURE_WEIGHTS,
    )

    consequence_weight = _match_weight(
        extracted_data.get("potential_consequence"),
        CONSEQUENCE_WEIGHTS,
    )

    score = (
        hazard_weight * exposure_weight
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