from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.main import app
from app.models.analysis import Analysis
from app.models.report import Report


client = TestClient(app)


def test_dashboard_summary_endpoint():
    db = SessionLocal()

    report = Report(
        id=uuid4(),
        raw_text=f"Dashboard API test incident {uuid4()}",
        metadata_={"site": "Dashboard API Test Plant"},
        is_synthetic=True,
    )
    db.add(report)
    db.flush()

    analysis = Analysis(
        report_id=report.id,
        extracted_data={
            "activity": "Test activity",
            "hazard": "Test hazard",
            "exposure": "Test exposure",
            "barrier": "Test barrier",
            "barrier_failure": "Unknown",
            "potential_consequence": "Serious injury",
        },
        risk_score=80,
        sif_level="HIGH",
        confidence=0.8,
        status="PENDING",
    )
    db.add(analysis)
    db.commit()

    try:
        response = client.get(
            "/api/v1/reports/dashboard-summary"
        )

        assert response.status_code == 200

        data = response.json()

        assert "total_reports" in data
        assert "high_sif_precursors" in data
        assert "emerging_pattern_count" in data
        assert "most_failed_barrier" in data
        assert "recent_high_sif_reports" in data

        assert data["total_reports"] >= 1
        assert data["high_sif_precursors"] >= 1

        recent = next(
            item
            for item in data["recent_high_sif_reports"]
            if item["id"] == str(report.id)
        )

        assert recent["site"] == "Dashboard API Test Plant"
        assert recent["score"] == 80

    finally:
        db.rollback()

        db.query(Analysis).filter(
            Analysis.report_id == report.id
        ).delete(synchronize_session=False)

        db.query(Report).filter(
            Report.id == report.id
        ).delete(synchronize_session=False)

        db.commit()
        db.close()