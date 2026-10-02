import csv
import re
from io import StringIO
from uuid import UUID
from app.services.vector_service import generate_and_store_embedding
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import Report


def infer_report_site(text: str) -> str:
    labeled_site = re.search(
        r"^\s*(?:site(?:\s+name)?|location|facility|installation)\s*[:=-]\s*(.+?)\s*$",
        text,
        re.IGNORECASE | re.MULTILINE,
    )
    if labeled_site:
        return labeled_site.group(1).strip(" .,:;|-—") or "Unknown"

    named_site = re.search(
        r"\b(?:at|site\s+is|location\s+is)\s+(?:the\s+)?([A-Z][\w&'().-]*(?:\s+[A-Z][\w&'().-]*){0,5}\s+(?:oil\s*field|oilfield|field|refinery|terminal|plant|station))\b",
        text,
        re.IGNORECASE,
    )
    return named_site.group(1).strip() if named_site else "Unknown"


def is_report_csv_document(text: str) -> bool:
    try:
        header = next(csv.reader(StringIO((text or "").lstrip("\ufeff"))), [])
    except csv.Error:
        return False
    columns = {column.strip().lower() for column in header}
    return "site" in columns and bool(
        columns.intersection({
            "text",
            "report_text",
            "modified_report_text",
            "report_text_modified",
            "modified_text",
            "text_modified",
            "edited_report_text",
            "corrected_report_text",
        })
    )


def create_report(
    db: Session,
    raw_text: str,
    site: str,
    is_synthetic: bool = True,
    metadata: dict | None = None,
) -> Report:
    report_metadata = {"site": site}
    if metadata:
        report_metadata.update(metadata)

    report = Report(
        raw_text=raw_text,
        metadata_=report_metadata,
        is_synthetic=is_synthetic,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    generate_and_store_embedding(db, report)

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
    reports = list(db.scalars(statement).all())
    return [report for report in reports if not is_report_csv_document(report.raw_text)]


def delete_report(
    db: Session,
    report: Report,
) -> None:
    db.delete(report)
    db.commit()