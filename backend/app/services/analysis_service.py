from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.report import Report
from app.services.nlp_service import nlp_service
from app.services.risk_service import calculate_risk_score, calculate_confidence, get_sif_level


def analyze_report(db: Session, report: Report) -> Analysis:
    extracted_data = nlp_service.extract(report.raw_text)

    extracted_dict = extracted_data.model_dump()

    risk_score = calculate_risk_score(extracted_dict)
    sif_level = get_sif_level(risk_score)
    confidence = calculate_confidence(extracted_dict)  # ← replaces hardcoded 0.80

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