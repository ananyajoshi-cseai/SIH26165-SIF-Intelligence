import argparse
import csv
import sys
import uuid
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))

from app.db.database import SessionLocal
from app.models.report import Report
from app.services.analysis_service import analyze_report
from app.services.vector_service import generate_and_store_embedding


def parse_bool(value: str | None, default: bool = True) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {
        "true",
        "1",
        "yes",
        "y",
        "t",
    }


def seed_file(
    db,
    file_path: Path,
    run_analysis: bool = True,
) -> tuple[int, int, int]:

    if not file_path.exists():
        print(f"File not found: {file_path}")
        return 0, 0, 0

    inserted = 0
    skipped = 0
    analyzed = 0

    print(f"\nSeeding {file_path.name}...")

    with file_path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV file has no header")

        column_map = {
            column.strip().lower(): column
            for column in reader.fieldnames
            if column
        }

        required = {"report_id", "report_text", "site"}
        missing = required - set(column_map)

        if missing:
            raise ValueError(
                f"{file_path.name} is missing columns: "
                f"{', '.join(sorted(missing))}"
            )

        for row_number, row in enumerate(reader, start=2):

            raw_text = (
                row.get(column_map["report_text"]) or ""
            ).strip()

            if not raw_text:
                print(
                    f"Row {row_number}: empty report_text - skipped"
                )
                skipped += 1
                continue

            raw_id = (
                row.get(column_map["report_id"]) or ""
            ).strip()

            try:
                report_id = (
                    uuid.UUID(raw_id)
                    if raw_id
                    else uuid.uuid4()
                )
            except ValueError:
                print(
                    f"Row {row_number}: invalid report_id "
                    f"'{raw_id}' - skipped"
                )
                skipped += 1
                continue

            if db.query(Report).filter(
                Report.id == report_id
            ).first():
                skipped += 1
                continue

            site = (
                row.get(column_map["site"]) or "Unknown"
            ).strip() or "Unknown"

            department = (
                row.get(column_map.get("department", ""), "")
                or "Unknown"
            ).strip()

            date = (
                row.get(column_map.get("date", ""), "")
                or ""
            ).strip()

            synthetic = parse_bool(
                row.get(column_map.get("is_synthetic", "")),
                default=True,
            )

            report = Report(
                id=report_id,
                raw_text=raw_text,
                is_synthetic=synthetic,
                metadata_={
                    "site": site,
                    "department": department,
                    "date": date,
                },
            )

            db.add(report)
            db.commit()
            db.refresh(report)

            generate_and_store_embedding(
                db=db,
                report=report,
            )

            inserted += 1

            if run_analysis:
                try:
                    analyze_report(
                        db=db,
                        report=report,
                    )
                    analyzed += 1
                except Exception as exc:
                    db.rollback()
                    print(
                        f"Analysis failed for row "
                        f"{row_number}: {exc}"
                    )

            if inserted % 25 == 0:
                print(f"Processed {inserted} rows...")

    print(
        f"{file_path.name}: "
        f"{inserted} added, "
        f"{skipped} skipped, "
        f"{analyzed} analyzed"
    )

    return inserted, skipped, analyzed


def run_seeding(run_analysis: bool = True):

    datasets = [
        ROOT_DIR / "Dataset.csv",
        ROOT_DIR / "Edge_Cases.csv",
    ]

    print("=" * 60)
    print("SIF Intelligence Database Seeding")
    print("=" * 60)

    db = SessionLocal()

    try:
        totals = [0, 0, 0]

        for dataset in datasets:
            results = seed_file(
                db=db,
                file_path=dataset,
                run_analysis=run_analysis,
            )

            for index, value in enumerate(results):
                totals[index] += value

        print("\n" + "=" * 60)
        print("SEEDING COMPLETE")
        print("=" * 60)
        print(f"Reports added:    {totals[0]}")
        print(f"Reports skipped:  {totals[1]}")
        print(f"Reports analyzed: {totals[2]}")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--skip-analysis",
        action="store_true",
        help="Skip NLP/risk analysis.",
    )

    args = parser.parse_args()

    run_seeding(
        run_analysis=not args.skip_analysis,
    )
