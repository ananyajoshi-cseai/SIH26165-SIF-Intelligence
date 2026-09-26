from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.report import Report
from app.services.classification_service import (
    classify_report_type,
    classify_sif_potential,
)
from app.services.nlp_service import nlp_service
from app.services.risk_service import (
    calculate_confidence,
    calculate_risk_score,
    get_sif_level,
)


def analyze_report(db: Session, report: Report) -> Analysis:
    # 1. Classify the report type.
    report_type, report_type_confidence = classify_report_type(
        report.raw_text
    )

    # 2. Existing NLP extraction.
    extracted_data = nlp_service.extract(report.raw_text)
    extracted_dict = extracted_data.model_dump()

    # 3. Existing deterministic risk calculation.
    risk_score = calculate_risk_score(extracted_dict)
    sif_level = get_sif_level(risk_score)
    confidence = calculate_confidence(extracted_dict)

    # 4. SIF potential classification.
    sif_potential, sif_confidence = classify_sif_potential(
        report_type=report_type,
        risk_score=risk_score,
        extraction=extracted_dict,
    )

    # 5. Store classification inside the existing JSONB field.
    extracted_dict.update(
        {
            "report_type": report_type,
            "report_type_confidence": report_type_confidence,
            "sif_potential": sif_potential,
            "sif_confidence": sif_confidence,
        }
    )

    analysis = Analysis(
        report_id=report.id,
        extracted_data=extracted_dict,
        risk_score=risk_score,
        sif_level=sif_level,
        confidence=confidence,
        status="PENDING",
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis
