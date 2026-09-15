from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.report import Report
from app.services.barrier_service import get_barrier_failure_intelligence
from app.services.pattern_service import detect_emerging_patterns


def _risk_level(score: float) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _percentage_change(current: int, previous: int) -> float | None:
    if previous == 0:
        return None if current == 0 else 100.0
    return round(((current - previous) / previous) * 100, 1)


def get_dashboard_summary(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    previous_month_end = month_start - timedelta(microseconds=1)
    previous_month_start = previous_month_end.replace(day=1)

    today_statement = (
        select(Report, Analysis)
        .join(Analysis, Analysis.report_id == Report.id)
        .where(Report.created_at >= today_start)
        .where(Report.created_at <= now)
    )
    today_rows = db.execute(today_statement).all()

    today_reports = db.scalars(
        select(Report).where(
            Report.created_at >= today_start,
            Report.created_at <= now,
        )
    ).all()
    total_reports = len({
        report.metadata_.get("upload_batch_id", str(report.id))
        for report in today_reports
    })

    high_sif_precursors = db.scalar(
        select(func.count(Analysis.id))
        .join(Report, Analysis.report_id == Report.id)
        .where(
            Analysis.sif_level == "HIGH",
            Report.created_at >= today_start,
            Report.created_at <= now,
        )
    ) or 0

    severity_counts = Counter(analysis.sif_level for _, analysis in today_rows)
    sif_breakdown = [
        {"label": "HIGH", "count": severity_counts.get("HIGH", 0)},
        {"label": "MEDIUM", "count": severity_counts.get("MEDIUM", 0)},
        {"label": "LOW", "count": severity_counts.get("LOW", 0)},
    ]

    hazard_counts = Counter(
        value.strip()
        for _, analysis in today_rows
        if (value := analysis.extracted_data.get("hazard"))
        and value != "Unknown"
    )
    top_hazards = [
        {"label": hazard, "count": count}
        for hazard, count in hazard_counts.most_common(3)
    ]

    site_scores = defaultdict(list)
    for report, analysis in today_rows:
        site = report.metadata_.get("site", "Unknown")
        site_scores[site].append(analysis.risk_score)

    highest_risk_locations = []
    for site, scores in site_scores.items():
        average_score = sum(scores) / len(scores)
        highest_risk_locations.append(
            {
                "site": site,
                "risk": round(average_score),
                "level": _risk_level(average_score),
                "reports": len(scores),
            }
        )
    highest_risk_locations.sort(key=lambda item: item["risk"], reverse=True)
    highest_risk_locations = highest_risk_locations[:5]

    month_statement = (
        select(Analysis, Report.created_at)
        .join(Report, Analysis.report_id == Report.id)
        .where(Report.created_at >= previous_month_start)
        .where(Report.created_at <= now)
    )
    month_rows = db.execute(month_statement).all()

    current_energy_isolation = sum(
        1
        for analysis, created_at in month_rows
        if created_at >= month_start
        and "energy isolation" in str(
            analysis.extracted_data.get("barrier_failure", "")
        ).lower()
    )
    previous_energy_isolation = sum(
        1
        for analysis, created_at in month_rows
        if previous_month_start <= created_at < month_start
        and "energy isolation" in str(
            analysis.extracted_data.get("barrier_failure", "")
        ).lower()
    )
    energy_change = _percentage_change(
        current_energy_isolation,
        previous_energy_isolation,
    )
    trends = [
        {
            "label": "Energy isolation",
            "current_count": current_energy_isolation,
            "previous_count": previous_energy_isolation,
            "percentage_change": energy_change,
            "direction": (
                "increased"
                if energy_change is not None and energy_change > 0
                else "decreased"
                if energy_change is not None and energy_change < 0
                else "unchanged"
            ),
        }
    ]

    patterns = detect_emerging_patterns(db)

    barrier_failures = get_barrier_failure_intelligence(db)

    barrier_failure_counts = [
        {
            "label": item["barrier_failure"],
            "count": item["incident_count"],
        }
        for item in barrier_failures[:5]
    ]

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
        "period_label": today_start.strftime("%d %b %Y"),
        "sif_breakdown": sif_breakdown,
        "top_hazards": top_hazards,
        "barrier_failures": barrier_failure_counts,
        "highest_risk_locations": highest_risk_locations,
        "trends": trends,
    }