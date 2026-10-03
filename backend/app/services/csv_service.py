import csv
import hashlib
from uuid import uuid4
from io import StringIO

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.services.ingestion_lock import lock_ingestion

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


def import_reports_from_csv(db: Session, content: bytes) -> tuple[list[Report], int]:
    """Stage a complete batch; caller commits rows and analyses atomically.

    Recover legacy partial batches by matching each source row once, in order.
    An exact-file retry is serialized until the caller commits or rolls back.
    """
    rows = parse_csv(content)
    upload_hash = hashlib.sha256(content).hexdigest()
    lock_ingestion(db, "csv:" + upload_hash)
    existing = list(db.scalars(
        select(Report).options(selectinload(Report.analysis))
        .where(Report.metadata_["upload_hash"].as_string() == upload_hash)
        .order_by(Report.created_at, Report.id)
    ).all())
    upload_batch_id = (existing[0].metadata_.get("upload_batch_id") if existing else None) or str(uuid4())
    remaining = list(existing)
    reports = []
    created = 0
    for index, row in enumerate(rows):
        report = next((item for item in remaining
                       if item.raw_text == row["text"]
                       and item.metadata_.get("site") == row["site"]), None)
        if report is not None:
            remaining.remove(report)
        else:
            report = create_report(
                db=db, raw_text=row["text"], site=row["site"],
                is_synthetic=row["is_synthetic"], commit=False,
                metadata={"upload_batch_id": upload_batch_id,
                          "upload_hash": upload_hash,
                          "upload_row_index": index,
                          "ingestion_source": "csv_upload"},
            )
            created += 1
        reports.append(report)
    return reports, created
