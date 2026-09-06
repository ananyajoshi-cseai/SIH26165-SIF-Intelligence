from app.services.nlp_service import MockNLPService


def test_confined_space_extraction():
    service = MockNLPService()

    result = service.extract(
        "Worker entered a confined space without atmospheric testing."
    )

    assert result.activity == "Confined space entry"
    assert result.hazard == "Confined space"
    assert result.barrier_failure == "Atmospheric testing not completed"
    assert result.potential_consequence == "Fatality"


def test_unguarded_machine_extraction():
    service = MockNLPService()

    result = service.extract(
        "Worker approached an unguarded rotating machine during maintenance."
    )

    assert result.activity == "Machine maintenance"
    assert result.hazard == "Unguarded rotating machinery"
    assert result.barrier_failure == "Guard missing"


def test_suspended_load_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee was struck by a falling pipe during lifting operations."
    )

    assert result.activity == "Material handling / lifting"
    assert result.hazard == "Suspended load"
    assert result.exposure == "Worker in line of fire"


def test_fall_from_height_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee fractured leg in fall from drilling rig platform."
    )

    assert result.activity == "Work at height"
    assert result.hazard == "Fall from height"
    assert result.potential_consequence == "Serious injury"


def test_gas_leak_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee was killed by natural gas ignition following a gas leak."
    )

    assert result.activity == "Oil and gas operations"
    assert result.hazard == "Gas leak / pressure release"
    assert result.exposure == "Worker exposed to hazardous atmosphere"
    assert result.potential_consequence == "Fatality"


def test_electrical_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee was electrocuted when the drill boom struck a power line."
    )

    assert result.activity == "Drilling / equipment operation"
    assert result.hazard == "Electrical energy"
    assert result.barrier_failure == "LOTO violation"
    assert result.potential_consequence == "Fatality"


def test_caught_in_between_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee was killed when caught between the tong and drill tubing."
    )

    assert result.activity == "Drilling operation"
    assert result.hazard == "Caught-in / caught-between"
    assert result.potential_consequence == "Fatality"


def test_struck_by_drill_bit_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee's leg was broken by a 500-pound drill bit."
    )

    assert result.activity == "Material handling / lifting"
    assert result.hazard == "Suspended load"
    assert result.exposure == "Worker in line of fire"
    assert result.potential_consequence == "Serious injury"


def test_generic_drilling_injury_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee injures finger on drilling rig."
    )

    assert result.activity == "Drilling operation"
    assert result.hazard == "Drilling equipment incident"
    assert result.barrier_failure == "Equipment safety control failure"
    assert result.potential_consequence == "Medical treatment"


def test_lifeboat_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee is killed and others are injured in lifeboat accident."
    )

    assert result.activity == "Marine operation"
    assert result.hazard == "Marine / lifeboat incident"
    assert result.potential_consequence == "Fatality"


def test_perforating_gun_extraction():
    service = MockNLPService()

    result = service.extract(
        "Perforating gun kills employee and injures another."
    )

    assert result.activity == "Well completion / perforating"
    assert result.hazard == "Pressure / explosive energy"
    assert result.potential_consequence == "Fatality"


def test_equipment_setup_extraction():
    service = MockNLPService()

    result = service.extract(
        "Employee dies in an accident while setting up drilling rig."
    )

    assert result.activity == "Drilling rig setup"
    assert result.hazard == "Drilling equipment incident"
    assert result.potential_consequence == "Fatality"


def test_unknown_report_extraction():
    service = MockNLPService()

    result = service.extract(
        "This report contains no identifiable safety information."
    )

    assert result.activity == "Unknown"
    assert result.hazard == "Unknown"
    assert result.exposure == "Unknown"
    assert result.barrier == "Unknown"
    assert result.barrier_failure == "Unknown"
    assert result.potential_consequence == "Unknown"


def test_generic_drilling_rig_fatality_extraction():
    service = MockNLPService()

    result = service.extract(
        "One Employee Is Killed And Two Are Injured At Drilling Rig"
    )

    assert result.activity == "Drilling operation"
    assert result.hazard == "Drilling equipment incident"
    assert result.exposure == "Worker exposed to drilling equipment"
    assert result.potential_consequence == "Fatality"


def test_fall_from_derrick_board_precedence():
    service = MockNLPService()

    result = service.extract(
        "Employee Is Killed In Fall From Derrick Board"
    )

    assert result.hazard == "Fall from height"
    assert result.barrier_failure == "Fall protection failure"
    assert result.potential_consequence == "Fatality"


def test_fall_and_toppled_derrick_precedence():
    service = MockNLPService()

    result = service.extract(
        "Employee Dies After Fall And Crushed By Toppled Oil Derrick"
    )

    assert result.hazard == "Fall from height"
    assert result.potential_consequence == "Fatality"


def test_collapsing_rig_mast_precedence():
    service = MockNLPService()

    result = service.extract(
        "Employee Is Killed When Crushed By Collapsing Rig Mast"
    )

    assert result.hazard == "Equipment instability / collapse"
    assert result.barrier_failure == "Equipment stability failure"
    assert result.potential_consequence == "Fatality"
