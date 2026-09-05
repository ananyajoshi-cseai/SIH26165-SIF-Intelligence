from pydantic import BaseModel


class AssociatedHazard(BaseModel):
    hazard: str
    count: int


class BarrierFailureIntelligence(BaseModel):
    barrier_failure: str
    incident_count: int
    high_risk_count: int
    associated_hazards: list[AssociatedHazard]


class BarrierIntelligenceResponse(BaseModel):
    barrier_failures: list[BarrierFailureIntelligence]