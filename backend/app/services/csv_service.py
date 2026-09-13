import csv
from io import StringIO

from sqlalchemy.orm import Session

from app.models.report import Report
from app.services.report_service import create_report


REQUIRED_COLUMNS = {"site"}


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

    columns = {column.strip().lower() for column in reader.fieldnames if column}

    missing_columns = REQUIRED_COLUMNS - columns

    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required columns: {missing}")

    text_column = next(
        (
            column
            for column in reader.fieldnames
            if column and column.strip().lower() in {"text", "report_text"}
        ),
        None,
    )

    if text_column is None:
        raise ValueError("Missing required columns: text")

    rows = []

    for row_number, row in enumerate(reader, start=2):
        site = (row.get("site") or "").strip()
        report_text = (row.get(text_column) or "").strip()

        if not report_text:
            raise ValueError(
                f"Row {row_number}: 'text' cannot be empty"
            )

        rows.append(
            {
                "site": site or "Unknown",
                "text": report_text,
                "is_synthetic": (
                    str(row.get("is_synthetic", "true")).strip().lower()
                    == "true"
                ),
            }
        )

    if not rows:
        raise ValueError("CSV file contains no data rows")

    return rows


def import_reports_from_csv(db: Session, content: bytes) -> list[Report]:
    """
    Parse a CSV file and create Report records in the database.
    """
    rows = parse_csv(content)

    reports = []

    for row in rows:
        report = create_report(
            db=db,
            raw_text=row["text"],
            site=row["site"],
            is_synthetic=row["is_synthetic"],
        )
        reports.append(report)

    return reports
