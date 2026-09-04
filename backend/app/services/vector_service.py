from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import Report
from app.services.embedding_service import embedding_service


def generate_and_store_embedding(
    db: Session,
    report: Report,
) -> Report:
    """Generate an embedding for a report and persist it."""
    report.embedding = embedding_service.embed(report.raw_text)

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def find_similar_reports(
    db: Session,
    report_id: UUID,
    top_k: int = 3,
) -> list[tuple[Report, float]]:
    """Find the most similar reports using pgvector cosine distance."""

    report = db.get(Report, report_id)

    if report is None:
        raise ValueError("Report not found")

    if report.embedding is None:
        raise ValueError("Report does not have an embedding")

    distance = Report.embedding.cosine_distance(report.embedding)

    statement = (
        select(Report, distance)
        .where(
            Report.id != report_id,
            Report.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(top_k)
    )

    results = db.execute(statement).all()

    return [
        (similar_report, 1 - float(similarity_distance))
        for similar_report, similarity_distance in results
    ]