from uuid import UUID

from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.schemas.analysis import ExtractionData
from app.services.risk_service import calculate_risk_score, get_sif_level


def validate_analysis(
    db: Session,
    report_id: UUID,
    corrected_data: ExtractionData,
) -> Analysis:
    analysis = (
        db.query(Analysis)
        .filter(Analysis.report_id == report_id)
        .first()
    )

    if analysis is None:
        raise ValueError("Analysis not found")

    extracted_dict = corrected_data.model_dump()

    risk_score = calculate_risk_score(extracted_dict)
    sif_level = get_sif_level(risk_score)

    analysis.extracted_data = extracted_dict
    analysis.risk_score = risk_score
    analysis.sif_level = sif_level
    analysis.status = "VALIDATED"

    db.commit()
    db.refresh(analysis)

    return analysis
