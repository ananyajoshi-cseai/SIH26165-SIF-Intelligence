from app.services.risk_service import (
    calculate_contextual_risk,
    calculate_fatigue_score,
    calculate_risk_score,
    extract_fatigue_signals,
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

    assert score == 100
    assert get_sif_level(score) == "HIGH"


def test_machine_guarding_case():
    data = {
        "hazard": "Unguarded rotating machinery",
        "exposure": "Worker near rotating equipment",
        "barrier_failure": "Guard missing",
        "potential_consequence": "Serious injury",
    }

    score = calculate_risk_score(data)

    assert score == 70
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


def test_base_sif_score_remains_unchanged_with_fatigue_context():
    data = {
        "hazard": "Confined space",
        "exposure": "Worker exposed inside confined space",
        "barrier_failure": "Atmospheric testing not completed",
        "potential_consequence": "Fatality",
    }

    base_score = calculate_risk_score(data)
    contextual = calculate_contextual_risk(base_score, 68)

    assert base_score == 100
    assert contextual["base_sif_risk_score"] == base_score
    assert calculate_risk_score(data) == base_score


def test_high_fatigue_applies_expected_contextual_adjustment():
    result = calculate_contextual_risk(82, 68)

    assert result["fatigue_adjustment"] == 5
    assert result["contextual_risk_score"] == 87
    assert result["risk_change"] == 5
    assert result["contextual_risk_level"] == "HIGH"


def test_low_fatigue_applies_smaller_adjustment():
    result = calculate_contextual_risk(50, 20)

    assert result["fatigue_adjustment"] == 2
    assert result["contextual_risk_score"] == 52


def test_missing_fatigue_keeps_contextual_score_unavailable():
    result = calculate_contextual_risk(82, None)

    assert result["base_sif_risk_score"] == 82
    assert result["fatigue_adjustment"] is None
    assert result["contextual_risk_score"] is None
    assert result["risk_change"] is None


def test_contextual_score_is_bounded_and_level_uses_contextual_value():
    result = calculate_contextual_risk(79, 100)

    assert result["contextual_risk_score"] == 87
    assert result["contextual_risk_level"] == get_sif_level(result["contextual_risk_score"])
    assert 0 <= result["contextual_risk_score"] <= 100
    assert calculate_contextual_risk(99, 100)["contextual_risk_score"] == 100


def test_fatigue_score_uses_only_available_indicators():
    score = calculate_fatigue_score({
        "working_hours": 58,
        "consecutive_shifts": 7,
        "night_shifts": 4,
        "self_reported_fatigue": "high",
    })

    assert score is not None
    assert 0 <= score <= 100
    assert calculate_fatigue_score({}) is None


def test_fatigue_signals_can_be_extracted_from_report_text():
    signals = extract_fatigue_signals(
        "7 consecutive shifts, 58 hours worked, 4 night shifts, "
        "average rest 5.2 h, self-reported fatigue high"
    )

    assert signals == {
        "working_hours": 58,
        "consecutive_shifts": 7,
        "night_shifts": 4,
        "rest_gap_hours": 5.2,
        "self_reported_fatigue": "high",
    }
