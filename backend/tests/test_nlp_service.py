from app.services.nlp_service import MockNLPService


def test_confined_space_extraction():
    service = MockNLPService()

    result = service.extract(
        "Worker entered a confined space without atmospheric testing."
    )

    assert result.activity == "Confined space entry"
    assert result.hazard == "Confined space"
    assert result.barrier == "Atmospheric testing"
    assert result.barrier_failure == "Atmospheric testing not completed"
    assert result.potential_consequence == "Fatality"


def test_unguarded_machine_extraction():
    service = MockNLPService()

    result = service.extract(
        "Worker approached an unguarded rotating machine during maintenance."
    )

    assert result.activity == "Machine maintenance"
    assert result.hazard == "Unguarded rotating machinery"
    assert result.barrier == "Machine guarding"
    assert result.barrier_failure == "Guard missing"
    assert result.potential_consequence == "Serious injury"


def test_unknown_report_extraction():
    service = MockNLPService()

    result = service.extract(
        "Routine housekeeping activity was observed in the work area."
    )

    assert result.activity == "Unknown"
    assert result.hazard == "Unknown"
    assert result.exposure == "Unknown"
    assert result.barrier == "Unknown"
    assert result.barrier_failure == "Unknown"
    assert result.potential_consequence == "Unknown"