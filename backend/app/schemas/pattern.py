from pydantic import BaseModel


class TopSite(BaseModel):
    site: str
    count: int


class EmergingPattern(BaseModel):
    precursor_type: str
    precursor: str
    current_count: int
    previous_count: int
    increase: int
    percentage_increase: float | None = None
    severity: str
    top_sites: list[TopSite] = []
    affected_report_ids: list[str] = []
    last_reported_at: str | None = None


class EmergingPatternsResponse(BaseModel):
    patterns: list[EmergingPattern]