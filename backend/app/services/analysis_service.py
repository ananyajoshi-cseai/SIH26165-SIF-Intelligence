"""
analysis_service.py
--------------------
Orchestrates the full FACT AI analysis pipeline for a single report.

Pipeline order
~~~~~~~~~~~~~~
1. Classify report type  (Near Miss / Unsafe Condition / Unsafe Act)
2. Extract safety entities  (Groq LLM → rule-based fallback)
3. Deterministic risk scoring  (weighted formula — NOT the LLM)
4. SIF-potential classification
5. Persist to DB
"""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.analysis import Analysis
from app.models.report import Report
from app.services.classification_service import (
    classify_report_type,
    classify_sif_potential,
)
# FIX: was incorrectly importing from nlp_service — correct module is nlp_service
# If the real Groq-backed service exists use it; fall back to mock automatically.
try:
    from app.services.nlp_service import nlp_service          # Groq + fallback
except ImportError:                                            # pragma: no cover
    from app.services.mock_nlp_service import nlp_service     # type: ignore[assignment]

from app.services.risk_service import (
    calculate_confidence,
    calculate_contextual_risk,
    calculate_fatigue_score,
    calculate_risk_score,
    extract_fatigue_signals,
    get_sif_level,
)


def analyze_report(db: Session, report: Report) -> Analysis:
    """
    Run the full pipeline on *report* and persist an Analysis row.

    Returns the newly created (and committed) Analysis instance.
    """

    # 1. Report-type classification
    report_type, report_type_confidence = classify_report_type(report.raw_text)

    # 2. NLP entity extraction  (LLM → rule-based fallback)
    extracted_data = nlp_service.extract(report.raw_text)
    extracted_dict = extracted_data.model_dump()

    # 3. Deterministic risk scoring — never delegated to the LLM
    risk_score = calculate_risk_score(extracted_dict)
    sif_level  = get_sif_level(risk_score)
    confidence = calculate_confidence(extracted_dict)

    # 4. SIF-potential classification
    sif_potential, sif_confidence = classify_sif_potential(
        report_type=report_type,
        risk_score=risk_score,
        extraction=extracted_dict,
    )

    # 5. Merge classification outputs into the JSONB extraction field
    #    so the frontend can read them without extra joins.
    extracted_dict.update(
        {
            "report_type": report_type,
            "report_type_confidence": report_type_confidence,
            "sif_potential": sif_potential,
            "sif_confidence": sif_confidence,
        }
    )
    fatigue_signals = extract_fatigue_signals(report.raw_text)
    risk_context = calculate_contextual_risk(
        risk_score,
        calculate_fatigue_score(fatigue_signals),
        settings.fatigue_max_adjustment,
    )
    risk_context["fatigue_signals"] = fatigue_signals
    risk_context["fatigue_context_note"] = "Report-derived signals; not a medical diagnosis."
    extracted_dict["risk_context"] = risk_context

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
