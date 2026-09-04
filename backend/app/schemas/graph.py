from uuid import UUID

from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    type: str
    label: str


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphResponse(BaseModel):
    report_id: UUID
    nodes: list[GraphNode]
    edges: list[GraphEdge]
