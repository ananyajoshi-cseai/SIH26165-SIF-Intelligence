from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.analysis import Analysis
from app.schemas.analysis import ExtractionData
from app.services.risk_service import (
    calculate_contextual_risk,
    calculate_risk_score,
    get_sif_level,
)


def validate_analysis(
    db: Session,
    report_id: UUID,
    corrected_data: ExtractionData,
    decision: str = "VALIDATED",
) -> Analysis:
    analysis = (
        db.query(Analysis)
        .filter(Analysis.report_id == report_id)
        .first()
    )

    if analysis is None:
        raise ValueError("Analysis not found")

    # Preserve classification metadata while applying HSE extraction corrections.
    extracted_dict = {
        **(analysis.extracted_data or {}),
        **corrected_data.model_dump(),
    }
    risk_score = calculate_risk_score(extracted_dict)
    sif_level = get_sif_level(risk_score)
    previous_context = extracted_dict.get("risk_context")
    if previous_context:
        updated_context = calculate_contextual_risk(
            risk_score,
            previous_context.get("fatigue_score"),
            settings.fatigue_max_adjustment,
        )
        updated_context["fatigue_signals"] = previous_context.get("fatigue_signals", {})
        updated_context["fatigue_context_note"] = previous_context.get(
            "fatigue_context_note",
            "Report-derived signals; not a medical diagnosis.",
        )
        extracted_dict["risk_context"] = updated_context

    analysis.extracted_data = extracted_dict
    analysis.risk_score = risk_score
    analysis.sif_level = sif_level
    analysis.status = decision if decision in {"VALIDATED", "REJECTED"} else "VALIDATED"

    db.commit()
    db.refresh(analysis)

    return analysis
