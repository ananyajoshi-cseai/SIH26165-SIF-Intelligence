from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardReport(BaseModel):
    id: UUID
    site: str
    incident: str
    date: datetime
    score: int


class DashboardSummaryResponse(BaseModel):
    total_reports: int
    high_sif_precursors: int
    emerging_pattern_count: int
    most_failed_barrier: str | None
    recent_high_sif_reports: list[DashboardReport]