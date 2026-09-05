from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExtractionData(BaseModel):
    activity: str | None = None
    hazard: str | None = None
    exposure: str | None = None
    barrier: str | None = None
    barrier_failure: str | None = None
    potential_consequence: str | None = None


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    report_id: UUID
    extracted_data: ExtractionData
    risk_score: int
    sif_level: str
    confidence: float
    status: str


class FeedbackRequest(BaseModel):
    extracted_data: ExtractionData


class FeedbackResponse(BaseModel):
    report_id: UUID
    risk_score: int
    risk_level: str
    confidence: float
    status: str
