from uuid import uuid4

from app.db.database import SessionLocal
from app.models.analysis import Analysis
from app.models.report import Report
from app.services.dashboard_service import get_dashboard_summary


def test_dashboard_summary():
    db = SessionLocal()

    unique_text = f"Dashboard test incident {uuid4()}"

    try:
        report = Report(
            raw_text=unique_text,
            metadata_={"site": "Dashboard Test Plant"},
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

        result = get_dashboard_summary(db)

        assert result["total_reports"] >= 1
        assert result["high_sif_precursors"] >= 1
        assert result["emerging_pattern_count"] >= 0
        assert len(result["recent_high_sif_reports"]) >= 1

        recent = result["recent_high_sif_reports"][0]

        assert recent["id"] == report.id
        assert recent["site"] == "Dashboard Test Plant"
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