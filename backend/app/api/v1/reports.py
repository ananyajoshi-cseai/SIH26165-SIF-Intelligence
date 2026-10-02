from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
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
from app.services.evaluation_service import run_evaluation
from app.services.feedback_service import validate_analysis
from app.services.graph_service import build_causal_graph
from app.services.pattern_service import detect_emerging_patterns
from app.services.ocr_service import extract_text_from_image
from app.services.report_service import (
    create_report,
    delete_report,
    get_report,
    get_reports,
    infer_report_site,
    is_report_csv_document,
)
from app.services.risk_service import get_risk_breakdown
from app.services.vector_service import find_similar_reports

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def _analyze_response(report, analysis) -> AnalyzeResponse:
    extracted = analysis.extracted_data
    risk_context = extracted.get("risk_context", {})
    return AnalyzeResponse(
        report_id=report.id,
        report_type=extracted.get("report_type", "Unknown"),
        report_type_confidence=extracted.get("report_type_confidence", 0.0),
        sif_potential=extracted.get("sif_potential", "Unknown"),
        sif_confidence=extracted.get("sif_confidence", 0.0),
        risk_score=analysis.risk_score,
        risk_level=analysis.sif_level,
        confidence=analysis.confidence,
        extraction=extracted,
        risk_breakdown=RiskBreakdown(**get_risk_breakdown(extracted)),
        base_sif_risk_score=risk_context.get("base_sif_risk_score", analysis.risk_score),
        base_risk_level=risk_context.get("base_risk_level", analysis.sif_level),
        fatigue_score=risk_context.get("fatigue_score"),
        fatigue_level=risk_context.get("fatigue_level"),
        fatigue_adjustment=risk_context.get("fatigue_adjustment"),
        contextual_risk_score=risk_context.get("contextual_risk_score"),
        contextual_risk_level=risk_context.get("contextual_risk_level"),
        risk_change=risk_context.get("risk_change"),
        fatigue_signals=risk_context.get("fatigue_signals"),
    )


@router.get("/metrics")
def get_evaluation_metrics():
    """
    Returns classification evaluation metrics for both:
      - Report Type  (Near Miss / Unsafe Condition / Unsafe Act)
      - SIF Potential  (SIF Potential / Non-SIF Potential)
 
    Evaluated against the OIL India HSE Incident Dataset (29 real records
    + 6 synthetic balanced records = 35 total).
 
    Used in the PPT/demo to justify AI predictions with real numbers.
    """
    return run_evaluation()


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
        metadata={"ingestion_source": "report_api"},
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
    if is_report_csv_document(payload.text):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="CSV files contain multiple reports. Upload them as a CSV batch instead.",
        )

    report = create_report(
        db=db,
        raw_text=payload.text,
        site=payload.site or infer_report_site(payload.text),
        is_synthetic=False,
        metadata={"ingestion_source": "analyze_tab"},
    )

    analysis = analyze_report(
        db=db,
        report=report,
    )

    return _analyze_response(report, analysis)


@router.post("/ocr")
async def extract_report_image_text(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required",
        )

    allowed_extensions = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported image formats: PNG, JPG, JPEG, WEBP, BMP, TIFF",
        )

    try:
        extracted_text = extract_text_from_image(await file.read())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OCR failed: {exc}",
        ) from exc

    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text was found in the image",
        )

    return {"filename": file.filename, "text": extracted_text}


@router.post(
    "/analyze-image",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    site: str = Form("Unknown"),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required",
        )

    allowed_extensions = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")

    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported image formats: PNG, JPG, JPEG, WEBP, BMP, TIFF",
        )

    content = await file.read()

    try:
        extracted_text = extract_text_from_image(content)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OCR failed: {exc}",
        ) from exc

    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text was found in the image",
        )

    report = create_report(
        db=db,
        raw_text=extracted_text,
        site=infer_report_site(extracted_text) if site == "Unknown" else site,
        is_synthetic=False,
        metadata={"ingestion_source": "image_analysis"},
    )

    analysis = analyze_report(
        db=db,
        report=report,
    )

    return _analyze_response(report, analysis)


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
        reports, duplicate = import_reports_from_csv(db, content)
        analyses = [
            report.analysis or analyze_report(db, report)
            for report in reports
        ]
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "filename": file.filename,
        "total_rows": len(reports),
            "created": 0 if duplicate else len(reports),
        "analyzed": len(analyses),
            "duplicate": duplicate,
        "reports": [
            {
                "report_id": str(report.id),
                "site": report.metadata_.get("site", "Unknown"),
                "report_type": analysis.extracted_data.get(
                    "report_type",
                    "Unknown",
                ),
                "report_type_confidence": analysis.extracted_data.get(
                    "report_type_confidence",
                    0.0,
                ),
                "sif_potential": analysis.extracted_data.get(
                    "sif_potential",
                    "Unknown",
                ),
                "sif_confidence": analysis.extracted_data.get(
                    "sif_confidence",
                    0.0,
                ),
                "risk_score": analysis.risk_score,
                "risk_level": analysis.sif_level,
            }
            for report, analysis in zip(reports, analyses)
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
                "hazard": (
                    report.analysis.extracted_data.get("hazard", "Unknown")
                    if report.analysis
                    else "Unknown"
                ),
                "risk_level": report.analysis.sif_level if report.analysis else None,
                "risk_score": report.analysis.risk_score if report.analysis else None,
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
            decision=payload.decision,
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
