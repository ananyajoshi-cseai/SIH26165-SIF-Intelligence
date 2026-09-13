import uuid

import pytest

from app.db.database import SessionLocal
from app.models.analysis import Analysis
from app.models.report import Report
from app.schemas.analysis import ExtractionData
from app.services.feedback_service import validate_analysis


def test_validate_analysis_updates_extraction_and_risk():
    db = SessionLocal()

    report = Report(
        raw_text="Worker entered a confined space.",
        metadata_={"site": "Test Site"},
        is_synthetic=True,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    analysis = Analysis(
        report_id=report.id,
        extracted_data={
            "activity": "Unknown",
            "hazard": "Unknown",
            "exposure": "Unknown",
            "barrier": "Unknown",
            "barrier_failure": "Unknown",
            "potential_consequence": "Unknown",
        },
        risk_score=0,
        sif_level="LOW",
        confidence=0.80,
        status="PENDING",
    )
    db.add(analysis)
    db.commit()

    try:
        corrected_data = ExtractionData(
            activity="Confined space entry",
            hazard="Confined space",
            exposure="Worker exposed inside confined space",
            barrier="Atmospheric testing",
            barrier_failure="Atmospheric testing not completed",
            potential_consequence="Fatality",
        )

        result = validate_analysis(
            db=db,
            report_id=report.id,
            corrected_data=corrected_data,
        )

        assert result.extracted_data == corrected_data.model_dump()
        assert result.risk_score == 100
        assert result.sif_level == "HIGH"
        assert result.status == "VALIDATED"
        assert result.confidence == 0.80

    finally:
        db.delete(analysis)
        db.delete(report)
        db.commit()
        db.close()


def test_validate_analysis_missing_analysis():
    db = SessionLocal()

    missing_report_id = uuid.uuid4()

    corrected_data = ExtractionData(
        activity="Test activity",
        hazard="Unknown",
        exposure="Unknown",
        barrier="Unknown",
        barrier_failure="Unknown",
        potential_consequence="Unknown",
    )

    try:
        with pytest.raises(ValueError, match="Analysis not found"):
            validate_analysis(
                db=db,
                report_id=missing_report_id,
                corrected_data=corrected_data,
            )
    finally:
        db.close()
