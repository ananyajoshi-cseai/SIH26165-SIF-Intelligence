from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.analysis import AnalysisResponse, ExtractionData, RiskBreakdown


class ReportCreate(BaseModel):
    site: str = "Unknown"
    text: str = Field(..., min_length=1)
    is_synthetic: bool = False


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    created_at: datetime
    raw_text: str
    metadata: dict = Field(validation_alias="metadata_")
    is_synthetic: bool
    analysis: AnalysisResponse | None = None

    @field_validator("metadata")
    @classmethod
    def public_metadata(cls, value):
        return {key: item for key, item in value.items() if key != "embedding"}


class AnalyzeRequest(BaseModel):
    request_id: UUID | None = None
    is_synthetic: bool = False
    site: str | None = None
    text: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    report_id: UUID
    report_type: str
    report_type_confidence: float
    sif_potential: str
    sif_confidence: float
    risk_score: int
    risk_level: str
    confidence: float
    extraction: ExtractionData
    risk_breakdown: RiskBreakdown
    base_sif_risk_score: int
    base_risk_level: str
    fatigue_score: int | None = None
    fatigue_level: str | None = None
    fatigue_adjustment: int | None = None
    contextual_risk_score: int | None = None
    contextual_risk_level: str | None = None
    risk_change: int | None = None
    fatigue_signals: dict | None = None
