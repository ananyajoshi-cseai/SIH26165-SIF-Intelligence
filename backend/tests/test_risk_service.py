from app.services.risk_service import (
    calculate_risk_score,
    get_sif_level,
)


def test_confined_space_case():
    data = {
        "hazard": "Confined space",
        "exposure": "Worker exposed inside confined space",
        "barrier_failure": "Atmospheric testing not completed",
        "potential_consequence": "Fatality",
    }

    score = calculate_risk_score(data)

    assert score == 80
    assert get_sif_level(score) == "HIGH"


def test_machine_guarding_case():
    data = {
        "hazard": "Unguarded rotating machinery",
        "exposure": "Worker near rotating equipment",
        "barrier_failure": "Guard missing",
        "potential_consequence": "Serious injury",
    }

    score = calculate_risk_score(data)

    assert score == 67
    assert get_sif_level(score) == "MEDIUM"


def test_unknown_signals_return_zero():
    data = {
        "hazard": "Unknown",
        "exposure": "Unknown",
        "barrier_failure": "Unknown",
        "potential_consequence": "Unknown",
    }

    score = calculate_risk_score(data)

    assert score == 0
    assert get_sif_level(score) == "LOW"


def test_score_is_capped_at_100():
    data = {
        "hazard": "Confined space",
        "exposure": "Line of fire",
        "barrier_failure": "LOTO violation",
        "potential_consequence": "Fatality",
    }

    score = calculate_risk_score(data)

    assert score == 100


def test_sif_level_boundaries():
    assert get_sif_level(0) == "LOW"
    assert get_sif_level(39) == "LOW"
    assert get_sif_level(40) == "MEDIUM"
    assert get_sif_level(79) == "MEDIUM"
    assert get_sif_level(80) == "HIGH"
    assert get_sif_level(100) == "HIGH"
