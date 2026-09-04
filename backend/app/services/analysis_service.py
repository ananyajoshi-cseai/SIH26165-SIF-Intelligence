from sqlalchemy.orm import Session
from app.services.risk_service import calculate_risk_score, get_sif_level
from app.models.analysis import Analysis
from app.models.report import Report


def mock_extract(text: str) -> dict:
    """
    Temporary NLP extractor.

    This will later be replaced by Amna's actual
    LLM/NLP extraction module.
    """

    text_lower = text.lower()

    if "confined space" in text_lower:
        return {
            "activity": "Confined space entry",
            "hazard": "Confined space",
            "exposure": "Worker exposed inside confined space",
            "barrier": "Atmospheric testing",
            "barrier_failure": "Atmospheric testing not completed",
            "potential_consequence": "Fatality",
        }

    if "rotating machine" in text_lower or "unguarded" in text_lower:
        return {
            "activity": "Machine maintenance",
            "hazard": "Unguarded rotating machinery",
            "exposure": "Worker near rotating equipment",
            "barrier": "Machine guarding",
            "barrier_failure": "Guard missing",
            "potential_consequence": "Serious injury",
        }

    return {
        "activity": "Unknown",
        "hazard": "Unknown",
        "exposure": "Unknown",
        "barrier": "Unknown",
        "barrier_failure": "Unknown",
        "potential_consequence": "Unknown",
    }


def analyze_report(
    db: Session,
    report: Report,
) -> Analysis:

    extracted_data = mock_extract(report.raw_text)

    risk_score = calculate_risk_score(extracted_data)
    sif_level = get_sif_level(risk_score)

    analysis = Analysis(
        report_id=report.id,
        extracted_data=extracted_data,
        risk_score=risk_score,
        sif_level=sif_level,
        confidence=0.80,
        status="PENDING",
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis