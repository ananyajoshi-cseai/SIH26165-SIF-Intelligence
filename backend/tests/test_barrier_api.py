
from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.main import app
from app.models.analysis import Analysis
from app.models.report import Report


client = TestClient(app)


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
    return report


def test_barrier_intelligence_endpoint():
    db = SessionLocal()

    unique_failure = f"Test API barrier failure {uuid4()}"
    hazard_a = f"Test API hazard A {uuid4()}"
    hazard_b = f"Test API hazard B {uuid4()}"

    reports = []

    try:
        reports.append(
            _create_analysis(
                db,
                unique_failure,
                hazard_a,
                "HIGH",
            )
        )
        reports.append(
            _create_analysis(
                db,
                unique_failure,
                hazard_a,
                "MEDIUM",
            )
        )
        reports.append(
            _create_analysis(
                db,
                unique_failure,
                hazard_b,
                "HIGH",
            )
        )

        db.commit()

        response = client.get(
            "/api/v1/reports/barrier-intelligence"
        )

        assert response.status_code == 200

        data = response.json()

        assert "barrier_failures" in data

        result = next(
            item
            for item in data["barrier_failures"]
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

        report_ids = [report.id for report in reports]

        db.query(Analysis).filter(
            Analysis.report_id.in_(report_ids)
        ).delete(synchronize_session=False)

        db.query(Report).filter(
            Report.id.in_(report_ids)
        ).delete(synchronize_session=False)

        db.commit()
        db.close()


def test_barrier_intelligence_endpoint_returns_empty_list_when_no_matching_test_data():
    db = SessionLocal()

    unique_failure = f"Test API empty barrier {uuid4()}"

    try:
        response = client.get(
            "/api/v1/reports/barrier-intelligence"
        )

        assert response.status_code == 200

        data = response.json()

        assert "barrier_failures" in data
        assert isinstance(data["barrier_failures"], list)

        assert all(
            item["barrier_failure"] != unique_failure
            for item in data["barrier_failures"]
        )

    finally:
        db.close()
