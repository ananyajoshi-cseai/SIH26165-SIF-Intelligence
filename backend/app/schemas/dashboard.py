from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardReport(BaseModel):
    id: UUID
    site: str
    incident: str
    date: datetime
    score: int


class DashboardCount(BaseModel):
    label: str
    count: int


class DashboardSiteRisk(BaseModel):
    site: str
    risk: int
    level: str
    reports: int


class DashboardTrend(BaseModel):
    label: str
    current_count: int
    previous_count: int
    percentage_change: float | None
    direction: str


class DashboardSummaryResponse(BaseModel):
    total_reports: int
    high_sif_precursors: int
    emerging_pattern_count: int
    most_failed_barrier: str | None
    recent_high_sif_reports: list[DashboardReport]
    period_label: str
    sif_breakdown: list[DashboardCount]
    top_hazards: list[DashboardCount]
    barrier_failures: list[DashboardCount]
    highest_risk_locations: list[DashboardSiteRisk]
    trends: list[DashboardTrend]