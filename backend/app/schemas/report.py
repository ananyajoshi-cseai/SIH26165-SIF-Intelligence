from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analysis import AnalysisResponse, ExtractionData, RiskBreakdown


class ReportCreate(BaseModel):
    site: str = "Unknown"
    text: str = Field(..., min_length=1)
    is_synthetic: bool = True


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: UUID
    created_at: datetime
    raw_text: str
    metadata: dict = Field(validation_alias="metadata_")
    is_synthetic: bool
    analysis: AnalysisResponse | None = None


class AnalyzeRequest(BaseModel):
    site: str = "Unknown"
    text: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    report_id: UUID
    risk_score: int
    risk_level: str
    confidence: float
    extraction: ExtractionData
    risk_breakdown: RiskBreakdown
