from pydantic import BaseModel


class EmergingPattern(BaseModel):
    precursor_type: str
    precursor: str
    current_count: int
    previous_count: int
    increase: int


class EmergingPatternsResponse(BaseModel):
    patterns: list[EmergingPattern]