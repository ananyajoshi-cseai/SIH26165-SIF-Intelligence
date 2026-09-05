from datetime import datetime, timedelta, timezone

from app.db.database import SessionLocal
from app.models.analysis import Analysis
from app.models.report import Report
from app.services.pattern_service import detect_emerging_patterns


def test_detect_emerging_patterns():
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    reports = []
    analyses = []

    try:
        # Previous 7-day window: 1 confined-space incident
        previous_report = Report(
            raw_text="Previous confined space incident.",
            metadata_={"site": "Test Plant"},
            is_synthetic=True,
            created_at=now - timedelta(days=8),
        )
        db.add(previous_report)
        db.commit()
        db.refresh(previous_report)

        previous_analysis = Analysis(
            report_id=previous_report.id,
            extracted_data={
                "activity": "Confined space entry",
                "hazard": "Test Emerging Confined Space",
                "exposure": "Worker exposed inside confined space",
                "barrier": "Atmospheric testing",
                "barrier_failure": "Atmospheric testing not completed",
                "potential_consequence": "Fatality",
            },
            risk_score=60,
            sif_level="MEDIUM",
            confidence=0.8,
            status="PENDING",
        )
        db.add(previous_analysis)

        # Current 7-day window: 3 confined-space incidents
        for index in range(3):
            report = Report(
                raw_text=f"Current confined space incident {index}.",
                metadata_={"site": "Test Plant"},
                is_synthetic=True,
                created_at=now - timedelta(days=2, hours=index),
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            reports.append(report)

            analysis = Analysis(
                report_id=report.id,
                extracted_data={
                    "activity": "Confined space entry",
                    "hazard": "Test Emerging Confined Space",
                    "exposure": "Worker exposed inside confined space",
                    "barrier": "Atmospheric testing",
                    "barrier_failure": "Atmospheric testing not completed",
                    "potential_consequence": "Fatality",
                },
                risk_score=60,
                sif_level="MEDIUM",
                confidence=0.8,
                status="PENDING",
            )
            db.add(analysis)
            analyses.append(analysis)

        db.add(previous_analysis)
        db.commit()

        patterns = detect_emerging_patterns(db)

        hazard_pattern = next(
            pattern
            for pattern in patterns
            if pattern["precursor_type"] == "hazard"
            and pattern["precursor"] == "Test Emerging Confined Space"
        )

        assert hazard_pattern["current_count"] == 3
        assert hazard_pattern["previous_count"] == 1
        assert hazard_pattern["increase"] == 2

    finally:
        for analysis in analyses:
            db.delete(analysis)

        db.delete(previous_analysis)

        for report in reports:
            db.delete(report)

        db.delete(previous_report)

        db.commit()
        db.close()


def test_detect_emerging_patterns_ignores_small_increases():
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    reports = []
    analyses = []

    try:
        for index in range(2):
            report = Report(
                raw_text=f"Current trip hazard incident {index}.",
                metadata_={"site": "Test Plant"},
                is_synthetic=True,
                created_at=now - timedelta(days=2, hours=index),
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            reports.append(report)

            analysis = Analysis(
                report_id=report.id,
                extracted_data={
                    "activity": "Walking",
                    "hazard": "Trip hazard",
                    "exposure": "Worker walking",
                    "barrier": "Housekeeping",
                    "barrier_failure": "Unknown",
                    "potential_consequence": "Medical treatment",
                },
                risk_score=5,
                sif_level="LOW",
                confidence=0.8,
                status="PENDING",
            )
            db.add(analysis)
            analyses.append(analysis)

        db.commit()

        patterns = detect_emerging_patterns(db)

        assert not any(
            pattern["precursor"] == "Trip hazard"
            for pattern in patterns
        )

    finally:
        for analysis in analyses:
            db.delete(analysis)

        for report in reports:
            db.delete(report)

        db.commit()
        db.close()