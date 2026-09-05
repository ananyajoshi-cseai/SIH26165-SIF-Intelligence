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


def _count_precursors(
    analyses: list[Analysis],
    field: str,
) -> dict[str, int]:
    counts: dict[str, int] = {}

    for analysis in analyses:
        value = _get_precursor_value(
            analysis.extracted_data,
            field,
        )

        if value:
            counts[value] = counts.get(value, 0) + 1

    return counts


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

    current_analyses = [
        analysis
        for report, analysis in rows
        if report.created_at >= current_start
    ]

    previous_analyses = [
        analysis
        for report, analysis in rows
        if previous_start <= report.created_at < current_start
    ]

    patterns = []

    for field, precursor_type in [
        ("hazard", "hazard"),
        ("barrier_failure", "barrier_failure"),
    ]:
        current_counts = _count_precursors(
            current_analyses,
            field,
        )
        previous_counts = _count_precursors(
            previous_analyses,
            field,
        )

        for precursor, current_count in current_counts.items():
            previous_count = previous_counts.get(
                precursor,
                0,
            )

            if (
                current_count >= 3
                and current_count > previous_count * 2
            ):
                patterns.append(
                    {
                        "precursor_type": precursor_type,
                        "precursor": precursor,
                        "current_count": current_count,
                        "previous_count": previous_count,
                        "increase": current_count - previous_count,
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