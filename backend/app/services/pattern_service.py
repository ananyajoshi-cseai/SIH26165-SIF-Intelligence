from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.report import Report


def _get_precursor_value(
    extracted_data: dict,
    field: str,
) -> str | None:
    value = extracted_data.get(field)

    if not value or value == "Unknown":
        return None

    return value.strip()


def _severity_label(current_count: int) -> str:
    if current_count >= 10:
        return "CRITICAL"
    if current_count >= 5:
        return "HIGH"
    return "MODERATE"


def _build_precursor_summary(
    rows: list[tuple[Report, Analysis]],
    field: str,
) -> dict[str, dict]:
    """Group (report, analysis) rows by precursor value, tracking count,
    contributing sites, report ids, and the most recent occurrence."""
    summary: dict[str, dict] = {}

    for report, analysis in rows:
        value = _get_precursor_value(analysis.extracted_data, field)

        if not value:
            continue

        entry = summary.setdefault(
            value,
            {
                "count": 0,
                "sites": {},
                "report_ids": [],
                "last_reported_at": None,
            },
        )

        entry["count"] += 1

        site = report.metadata_.get("site", "Unknown")
        entry["sites"][site] = entry["sites"].get(site, 0) + 1
        entry["report_ids"].append(str(report.id))

        if (
            entry["last_reported_at"] is None
            or report.created_at > entry["last_reported_at"]
        ):
            entry["last_reported_at"] = report.created_at

    return summary


def detect_emerging_patterns(
    db: Session,
    days: int = 7,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)

    statement = (
        select(Report, Analysis)
        .join(Analysis, Analysis.report_id == Report.id)
        .where(Report.created_at >= previous_start)
        .where(Report.created_at <= now)
    )

    rows = db.execute(statement).all()

    current_rows = [
        (report, analysis)
        for report, analysis in rows
        if report.created_at >= current_start
    ]

    previous_rows = [
        (report, analysis)
        for report, analysis in rows
        if previous_start <= report.created_at < current_start
    ]

    patterns = []

    for field, precursor_type in [
        ("hazard", "hazard"),
        ("barrier_failure", "barrier_failure"),
    ]:
        current_summary = _build_precursor_summary(current_rows, field)
        previous_summary = _build_precursor_summary(previous_rows, field)

        for precursor, current_info in current_summary.items():
            current_count = current_info["count"]
            previous_count = previous_summary.get(precursor, {}).get("count", 0)

            if current_count >= 3 and current_count > previous_count * 2:
                increase = current_count - previous_count

                percentage_increase = (
                    round((increase / previous_count) * 100, 1)
                    if previous_count > 0
                    else None
                )

                top_sites = sorted(
                    current_info["sites"].items(),
                    key=lambda item: item[1],
                    reverse=True,
                )

                patterns.append(
                    {
                        "precursor_type": precursor_type,
                        "precursor": precursor,
                        "current_count": current_count,
                        "previous_count": previous_count,
                        "increase": increase,
                        "percentage_increase": percentage_increase,
                        "severity": _severity_label(current_count),
                        "top_sites": [
                            {"site": site, "count": count}
                            for site, count in top_sites[:3]
                        ],
                        "affected_report_ids": current_info["report_ids"][:5],
                        "last_reported_at": (
                            current_info["last_reported_at"].isoformat()
                            if current_info["last_reported_at"]
                            else None
                        ),
                    }
                )

    patterns.sort(
        key=lambda item: (
            item["current_count"],
            item["increase"],
        ),
        reverse=True,
    )

    return patterns