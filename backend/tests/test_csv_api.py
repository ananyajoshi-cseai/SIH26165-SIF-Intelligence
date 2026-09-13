from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.main import app
from app.models.analysis import Analysis
from app.models.report import Report


client = TestClient(app)


def test_csv_upload_creates_analysis():
    content = (
        "site,text,is_synthetic\n"
        "CSV Analysis Test Plant,Worker entered a confined space without atmospheric testing during maintenance.,true\n"
    ).encode("utf-8")

    response = client.post(
        "/api/v1/reports/upload",
        files={"file": ("test_reports.csv", content, "text/csv")},
    )

    assert response.status_code == 201

    data = response.json()

    assert data["filename"] == "test_reports.csv"
    assert data["total_rows"] == 1
    assert data["created"] == 1
    assert data["analyzed"] == 1
    assert len(data["reports"]) == 1

    report_data = data["reports"][0]

    assert report_data["site"] == "CSV Analysis Test Plant"
    assert report_data["risk_score"] == 100
    assert report_data["risk_level"] == "HIGH"

    report_id = report_data["report_id"]

    db = SessionLocal()

    try:
        report = db.get(Report, report_id)

        assert report is not None

        analysis = (
            db.query(Analysis)
            .filter(Analysis.report_id == report_id)
            .first()
        )

        assert analysis is not None
        assert analysis.risk_score == 100
        assert analysis.sif_level == "HIGH"
        assert analysis.status == "PENDING"
        assert analysis.extracted_data["hazard"] == "Confined space"
        assert analysis.extracted_data["barrier_failure"] == "Atmospheric testing not completed"

    finally:
        db.query(Analysis).filter(
            Analysis.report_id == report_id
        ).delete(synchronize_session=False)

        db.query(Report).filter(
            Report.id == report_id
        ).delete(synchronize_session=False)

        db.commit()
        db.close()
