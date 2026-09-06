from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.report import Report
from app.services.barrier_service import get_barrier_failure_intelligence
from app.services.pattern_service import detect_emerging_patterns


def get_dashboard_summary(db: Session) -> dict:
    total_reports = db.scalar(
        select(func.count(Report.id))
    ) or 0

    high_sif_precursors = db.scalar(
        select(func.count(Analysis.id)).where(
            Analysis.sif_level == "HIGH"
        )
    ) or 0

    patterns = detect_emerging_patterns(db)

    barrier_failures = get_barrier_failure_intelligence(db)

    most_failed_barrier = None

    if barrier_failures:
        most_failed_barrier = barrier_failures[0]["barrier_failure"]

    statement = (
        select(Report, Analysis)
        .join(
            Analysis,
            Analysis.report_id == Report.id,
        )
        .where(Analysis.sif_level == "HIGH")
        .order_by(Report.created_at.desc())
        .limit(5)
    )

    rows = db.execute(statement).all()

    recent_high_sif_reports = []

    for report, analysis in rows:
        recent_high_sif_reports.append(
            {
                "id": report.id,
                "site": report.metadata_.get(
                    "site",
                    "Unknown",
                ),
                "incident": report.raw_text,
                "date": report.created_at,
                "score": analysis.risk_score,
            }
        )

    return {
        "total_reports": total_reports,
        "high_sif_precursors": high_sif_precursors,
        "emerging_pattern_count": len(patterns),
        "most_failed_barrier": most_failed_barrier,
        "recent_high_sif_reports": recent_high_sif_reports,
    }