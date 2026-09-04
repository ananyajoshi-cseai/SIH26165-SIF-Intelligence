from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import Report


def create_report(
    db: Session,
    raw_text: str,
    site: str,
    is_synthetic: bool = True,
) -> Report:
    report = Report(
        raw_text=raw_text,
        metadata_={"site": site},
        is_synthetic=is_synthetic,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_report(
    db: Session,
    report_id: UUID,
) -> Report | None:
    statement = select(Report).where(Report.id == report_id)

    return db.scalar(statement)


def get_reports(
    db: Session,
) -> list[Report]:
    statement = select(Report).order_by(Report.created_at.desc())

    return list(db.scalars(statement).all())


def delete_report(
    db: Session,
    report: Report,
) -> None:
    db.delete(report)
    db.commit()