from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis import Analysis


def _get_value(extracted_data: dict, field: str) -> str | None:
    value = extracted_data.get(field)

    if not value or value == "Unknown":
        return None

    return value.strip()


def get_barrier_failure_intelligence(db: Session) -> list[dict]:
    statement = select(Analysis)
    analyses = list(db.scalars(statement).all())

    barrier_data: dict[str, dict] = {}

    for analysis in analyses:
        barrier_failure = _get_value(
            analysis.extracted_data,
            "barrier_failure",
        )

        if not barrier_failure:
            continue

        hazard = _get_value(
            analysis.extracted_data,
            "hazard",
        )

        if barrier_failure not in barrier_data:
            barrier_data[barrier_failure] = {
                "barrier_failure": barrier_failure,
                "incident_count": 0,
                "high_risk_count": 0,
                "hazards": {},
            }

        data = barrier_data[barrier_failure]
        data["incident_count"] += 1

        if analysis.sif_level == "HIGH":
            data["high_risk_count"] += 1

        if hazard:
            data["hazards"][hazard] = (
                data["hazards"].get(hazard, 0) + 1
            )

    results = []

    for data in barrier_data.values():
        associated_hazards = [
            {
                "hazard": hazard,
                "count": count,
            }
            for hazard, count in data["hazards"].items()
        ]

        associated_hazards.sort(
            key=lambda item: item["count"],
            reverse=True,
        )

        results.append(
            {
                "barrier_failure": data["barrier_failure"],
                "incident_count": data["incident_count"],
                "high_risk_count": data["high_risk_count"],
                "associated_hazards": associated_hazards,
            }
        )

    results.sort(
        key=lambda item: (
            item["incident_count"],
            item["high_risk_count"],
        ),
        reverse=True,
    )

    return results