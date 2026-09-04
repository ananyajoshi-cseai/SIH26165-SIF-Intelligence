from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import (
    create_report,
    delete_report,
    get_report,
    get_reports,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report_endpoint(
    payload: ReportCreate,
    db: Session = Depends(get_db),
):
    return create_report(
        db=db,
        raw_text=payload.text,
        site=payload.site,
        is_synthetic=payload.is_synthetic,
    )


@router.get(
    "",
    response_model=list[ReportResponse],
)
def list_reports(
    db: Session = Depends(get_db),
):
    return get_reports(db)


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
)
def get_report_endpoint(
    report_id: UUID,
    db: Session = Depends(get_db),
):
    report = get_report(db, report_id)

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_report_endpoint(
    report_id: UUID,
    db: Session = Depends(get_db),
):
    report = get_report(db, report_id)

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    delete_report(db, report)