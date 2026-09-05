from datetime import datetime, timezone
from uuid import uuid4

from app.db.database import SessionLocal
from app.models.analysis import Analysis
from app.models.report import Report
from app.services.barrier_service import get_barrier_failure_intelligence


def _create_analysis(
    db,
    barrier_failure,
    hazard,
    sif_level,
):
    report = Report(
        id=uuid4(),
        raw_text="Test safety report",
        metadata_={"site": "Test site"},
        is_synthetic=True,
    )
    db.add(report)
    db.flush()

    analysis = Analysis(
        report_id=report.id,
        extracted_data={
            "activity": "Test activity",
            "hazard": hazard,
            "exposure": "Test exposure",
            "barrier": "Test barrier",
            "barrier_failure": barrier_failure,
            "potential_consequence": "Serious injury",
        },
        risk_score=80 if sif_level == "HIGH" else 50,
        sif_level=sif_level,
        confidence=0.8,
        status="PENDING",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(analysis)

    return analysis


def test_barrier_failure_intelligence():
    db = SessionLocal()

    unique_failure = f"Test barrier failure {uuid4()}"
    hazard_a = f"Test hazard A {uuid4()}"
    hazard_b = f"Test hazard B {uuid4()}"

    try:
        _create_analysis(
            db,
            unique_failure,
            hazard_a,
            "HIGH",
        )
        _create_analysis(
            db,
            unique_failure,
            hazard_a,
            "MEDIUM",
        )
        _create_analysis(
            db,
            unique_failure,
            hazard_b,
            "HIGH",
        )

        db.commit()

        results = get_barrier_failure_intelligence(db)

        result = next(
            item
            for item in results
            if item["barrier_failure"] == unique_failure
        )

        assert result["incident_count"] == 3
        assert result["high_risk_count"] == 2

        hazards = {
            item["hazard"]: item["count"]
            for item in result["associated_hazards"]
        }

        assert hazards[hazard_a] == 2
        assert hazards[hazard_b] == 1

    finally:
        db.rollback()

        db.query(Analysis).filter(
            Analysis.extracted_data["barrier_failure"].as_string()
            == unique_failure
        ).delete(synchronize_session=False)

        db.commit()
        db.close()


def test_barrier_failure_intelligence_ignores_unknown():
    db = SessionLocal()

    unique_hazard = f"Test hazard {uuid4()}"

    try:
        _create_analysis(
            db,
            "Unknown",
            unique_hazard,
            "HIGH",
        )

        db.commit()

        results = get_barrier_failure_intelligence(db)

        assert all(
            item["barrier_failure"] != "Unknown"
            for item in results
        )

    finally:
        db.rollback()

        db.query(Analysis).filter(
            Analysis.extracted_data["barrier_failure"].as_string()
            == "Unknown"
        ).delete(synchronize_session=False)

        db.commit()
        db.close()