from uuid import UUID

from sqlalchemy.orm import Session

from app.models.report import Report


SIMILARITY_THRESHOLD = 0.75


def generate_and_store_embedding(
    db: Session,
    report: Report,
) -> Report:
    # pgvector disabled temporarily
    return report


def find_similar_reports(
    db: Session,
    report_id: UUID,
    top_k: int = 3,
) -> list[tuple[Report, float]]:
    # pgvector disabled temporarily — returns empty list
    report = db.get(Report, report_id)

    if report is None:
        raise ValueError("Report not found")

    return []