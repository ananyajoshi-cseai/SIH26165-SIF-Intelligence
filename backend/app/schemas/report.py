from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analysis import ExtractionData


class ReportCreate(BaseModel):
    site: str = "Unknown"
    text: str = Field(..., min_length=1)
    is_synthetic: bool = True


class ReportResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    raw_text: str
    metadata: dict = Field(validation_alias="metadata_")
    is_synthetic: bool


class AnalyzeRequest(BaseModel):
    site: str = "Unknown"
    text: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    report_id: UUID
    risk_score: int
    risk_level: str
    confidence: float
    extraction: ExtractionData