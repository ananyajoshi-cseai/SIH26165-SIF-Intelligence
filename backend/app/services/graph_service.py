from uuid import UUID

from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse


def build_causal_graph(db: Session, report_id: UUID) -> GraphResponse:
    analysis = (
        db.query(Analysis)
        .filter(Analysis.report_id == report_id)
        .first()
    )

    if analysis is None:
        raise ValueError("Analysis not found")

    data = analysis.extracted_data or {}

    activity = data.get("activity") or "Unknown"
    hazard = data.get("hazard") or "Unknown"
    barrier_failure = data.get("barrier_failure") or "Unknown"
    consequence = data.get("potential_consequence") or "Unknown"

    nodes = [
        GraphNode(
            id="activity",
            type="activity",
            label=activity,
        ),
        GraphNode(
            id="hazard",
            type="hazard",
            label=hazard,
        ),
        GraphNode(
            id="barrier_failure",
            type="barrier_failure",
            label=barrier_failure,
        ),
        GraphNode(
            id="consequence",
            type="consequence",
            label=consequence,
        ),
    ]

    edges = [
        GraphEdge(
            source="activity",
            target="hazard",
        ),
        GraphEdge(
            source="hazard",
            target="barrier_failure",
        ),
        GraphEdge(
            source="barrier_failure",
            target="consequence",
        ),
    ]

    return GraphResponse(
        report_id=report_id,
        nodes=nodes,
        edges=edges,
    )
