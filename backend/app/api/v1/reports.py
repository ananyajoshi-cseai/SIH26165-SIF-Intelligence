from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.analysis import FeedbackRequest, FeedbackResponse, RiskBreakdown
from app.schemas.barrier import BarrierIntelligenceResponse
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.graph import GraphResponse
from app.schemas.pattern import EmergingPatternsResponse
from app.schemas.report import (
    AnalyzeRequest,
    AnalyzeResponse,
    ReportCreate,
    ReportResponse,
)
from app.services.analysis_service import analyze_report
from app.services.barrier_service import get_barrier_failure_intelligence
from app.services.csv_service import import_reports_from_csv
from app.services.dashboard_service import get_dashboard_summary
from app.services.feedback_service import validate_analysis
from app.services.graph_service import build_causal_graph
from app.services.pattern_service import detect_emerging_patterns
from app.services.report_service import (
    create_report,
    delete_report,
    get_report,
    get_reports,
)
from app.services.risk_service import get_risk_breakdown
from app.services.vector_service import find_similar_reports

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


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_report_endpoint(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    report = create_report(
        db=db,
        raw_text=payload.text,
        site=payload.site,
        is_synthetic=True,
    )

    analysis = analyze_report(
        db=db,
        report=report,
    )

    return AnalyzeResponse(
        report_id=report.id,
        risk_score=analysis.risk_score,
        risk_level=analysis.sif_level,
        confidence=analysis.confidence,
        extraction=analysis.extracted_data,
        risk_breakdown=RiskBreakdown(
            **get_risk_breakdown(analysis.extracted_data)
        ),
    )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_reports(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    content = await file.read()

    try:
        reports = import_reports_from_csv(db, content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "filename": file.filename,
        "total_rows": len(reports),
        "created": len(reports),
        "reports": [
            {
                "report_id": str(report.id),
                "site": report.metadata_.get("site", "Unknown"),
            }
            for report in reports
        ],
    }


@router.get("/{report_id}/similar")
def get_similar_reports_endpoint(
    report_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        results = find_similar_reports(
            db=db,
            report_id=report_id,
            top_k=3,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return {
        "report_id": str(report_id),
        "similar_reports": [
            {
                "report_id": str(report.id),
                "similarity": round(float(similarity), 4),
                "site": report.metadata_.get("site", "Unknown"),
                "text": report.raw_text,
            }
            for report, similarity in results
        ],
    }


@router.get(
    "/{report_id}/graph",
    response_model=GraphResponse,
)
def get_causal_graph(
    report_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        return build_causal_graph(
            db=db,
            report_id=report_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put(
    "/{report_id}/feedback",
    response_model=FeedbackResponse,
)
def submit_feedback(
    report_id: UUID,
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
):
    try:
        analysis = validate_analysis(
            db=db,
            report_id=report_id,
            corrected_data=payload.extracted_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return FeedbackResponse(
        report_id=analysis.report_id,
        risk_score=analysis.risk_score,
        risk_level=analysis.sif_level,
        confidence=analysis.confidence,
        status=analysis.status,
        risk_breakdown=RiskBreakdown(
            **get_risk_breakdown(analysis.extracted_data)
        ),
    )


@router.get(
    "/barrier-intelligence",
    response_model=BarrierIntelligenceResponse,
)
def get_barrier_intelligence(
    db: Session = Depends(get_db),
):
    barrier_failures = get_barrier_failure_intelligence(db)

    return BarrierIntelligenceResponse(
        barrier_failures=barrier_failures,
    )


@router.get(
    "/emerging-patterns",
    response_model=EmergingPatternsResponse,
)
def get_emerging_patterns(
    db: Session = Depends(get_db),
):
    patterns = detect_emerging_patterns(db)

    return EmergingPatternsResponse(
        patterns=patterns,
    )


@router.get(
    "/dashboard-summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary_endpoint(
    db: Session = Depends(get_db),
):
    return get_dashboard_summary(db)


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
