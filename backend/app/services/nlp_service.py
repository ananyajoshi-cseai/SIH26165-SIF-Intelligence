import json
import logging

from groq import Groq

from app.core.config import settings
from app.schemas.analysis import ExtractionData
from app.services.mock_nlp_service import MockNLPService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a safety analysis AI for oil and gas operations.
Your ONLY job is to extract structured safety entities from incident reports.
You MUST return ONLY a valid JSON object — no preamble, no explanation, no markdown.

Return exactly this structure:
{
  "activity": "...",
  "hazard": "...",
  "exposure": "...",
  "barrier": "...",
  "barrier_failure": "...",
  "potential_consequence": "..."
}

Rules:
- activity: What work was being done? (e.g. "Lifting operation", "Confined space entry", "Hot work")
- hazard: What was the dangerous energy or condition? (e.g. "Suspended load", "Toxic atmosphere", "Electrical energy")
- exposure: How was the worker exposed to the hazard? (e.g. "Worker in line of fire", "Worker exposed to energized equipment")
- barrier: What safety control should have protected them? (e.g. "Exclusion zone", "LOTO", "Atmospheric testing")
- barrier_failure: What failed or was missing? (e.g. "Exclusion zone breached", "LOTO not applied", "No atmospheric test performed")
- potential_consequence: What is the worst credible outcome? (e.g. "Fatality", "Serious injury", "Medical treatment")

If a field cannot be determined from the text, use "Unknown".
Never invent details not present in the report.
Return ONLY the JSON object."""


class NLPService:
    def __init__(self):
        self._client = Groq(api_key=settings.groq_api_key)
        self._fallback = MockNLPService()

    def extract(self, text: str) -> ExtractionData:
        text = (text or "").strip()

        if not text:
            return ExtractionData(
                activity="Unknown",
                hazard="Unknown",
                exposure="Unknown",
                barrier="Unknown",
                barrier_failure="Unknown",
                potential_consequence="Unknown",
            )

        try:
            return self._extract_via_groq(text)
        except Exception as e:
            logger.warning(f"Groq extraction failed, using rule-based fallback. Error: {e}")
            return self._fallback.extract(text)

    def _extract_via_groq(self, text: str) -> ExtractionData:
        response = self._client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract safety entities from this report:\n\n{text}"},
            ],
            temperature=0.0,
            max_tokens=300,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        parsed = json.loads(raw)

        return ExtractionData(
            activity=parsed.get("activity") or "Unknown",
            hazard=parsed.get("hazard") or "Unknown",
            exposure=parsed.get("exposure") or "Unknown",
            barrier=parsed.get("barrier") or "Unknown",
            barrier_failure=parsed.get("barrier_failure") or "Unknown",
            potential_consequence=parsed.get("potential_consequence") or "Unknown",
        )


nlp_service = NLPService()