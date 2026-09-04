from typing import Protocol

from app.schemas.analysis import ExtractionData


class NLPService(Protocol):
    def extract(self, text: str) -> ExtractionData:
        ...


class MockNLPService:
    """Temporary NLP implementation used until the real NLP module is integrated."""

    def extract(self, text: str) -> ExtractionData:
        text_lower = text.lower()

        if "confined space" in text_lower:
            return ExtractionData(
                activity="Confined space entry",
                hazard="Confined space",
                exposure="Worker exposed inside confined space",
                barrier="Atmospheric testing",
                barrier_failure="Atmospheric testing not completed",
                potential_consequence="Fatality",
            )

        if "rotating machine" in text_lower or "unguarded" in text_lower:
            return ExtractionData(
                activity="Machine maintenance",
                hazard="Unguarded rotating machinery",
                exposure="Worker near rotating equipment",
                barrier="Machine guarding",
                barrier_failure="Guard missing",
                potential_consequence="Serious injury",
            )

        return ExtractionData(
            activity="Unknown",
            hazard="Unknown",
            exposure="Unknown",
            barrier="Unknown",
            barrier_failure="Unknown",
            potential_consequence="Unknown",
        )


nlp_service: NLPService = MockNLPService()