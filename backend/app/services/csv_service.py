import csv
import hashlib
from uuid import uuid4
from io import StringIO

from sqlalchemy.orm import Session

from app.models.report import Report
from app.services.report_service import create_report, infer_report_site


def parse_csv(content: bytes) -> list[dict]:
    """
    Parse CSV content and validate required columns.

    Returns:
        A list of report rows as dictionaries.

    Raises:
        ValueError: If the CSV is empty, malformed, or missing required columns.
    """
    if not content:
        raise ValueError("CSV file is empty")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV file must be UTF-8 encoded") from exc

    reader = csv.DictReader(StringIO(text))

    if reader.fieldnames is None:
        raise ValueError("CSV file must contain a header row")

    site_column = next(
        (column for column in reader.fieldnames if column and column.strip().lower() == "site"),
        None,
    )
    text_columns = {
        column.strip().lower(): column
        for column in reader.fieldnames
        if column
    }
    text_column = next(
        (
            text_columns[name]
            for name in (
                "modified_report_text",
                "report_text_modified",
                "modified_text",
                "text_modified",
                "edited_report_text",
                "corrected_report_text",
                "text",
                "report_text",
            )
            if name in text_columns
        ),
        None,
    )

    if text_column is None:
        raise ValueError("Missing required columns: text")

    rows = []

    for row_number, row in enumerate(reader, start=2):
        report_text = (row.get(text_column) or "").strip()
        site = (row.get(site_column) or "").strip() if site_column else ""

        if not report_text:
            raise ValueError(
                f"Row {row_number}: 'text' cannot be empty"
            )

        site = site or infer_report_site(report_text)

        rows.append(
            {
                "site": site,
                "text": report_text,
                "is_synthetic": (
                    str(row.get("is_synthetic", "false")).strip().lower()
                    == "true"
                ),
            }
        )

    if not rows:
        raise ValueError("CSV file contains no data rows")

    return rows


def import_reports_from_csv(db: Session, content: bytes) -> tuple[list[Report], bool]:
    """
    Parse a CSV file and create Report records in the database.
    """
    rows = parse_csv(content)
    upload_hash = hashlib.sha256(content).hexdigest()

    existing = [
        report
        for report in db.query(Report).all()
        if report.metadata_.get("upload_hash") == upload_hash
    ]
    if existing:
        return existing, True

    upload_batch_id = str(uuid4())

    reports = []

    for row in rows:
        report = create_report(
            db=db,
            raw_text=row["text"],
            site=row["site"],
            is_synthetic=row["is_synthetic"],
            metadata={
                "upload_batch_id": upload_batch_id,
                "upload_hash": upload_hash,
                "ingestion_source": "csv_upload",
            },
        )
        reports.append(report)

    return reports, False
