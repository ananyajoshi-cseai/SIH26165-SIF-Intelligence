from uuid import uuid4

import pytest

from app.db.database import SessionLocal
from app.models.analysis import Analysis
from app.models.report import Report
from app.services.graph_service import build_causal_graph


def test_build_causal_graph():
    db = SessionLocal()

    report = Report(
        raw_text="Worker entered a confined space without atmospheric testing.",
        metadata_={"site": "Test Plant"},
        is_synthetic=True,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    analysis = Analysis(
        report_id=report.id,
        extracted_data={
            "activity": "Confined space entry",
            "hazard": "Confined space",
            "exposure": "Worker exposed inside confined space",
            "barrier": "Atmospheric testing",
            "barrier_failure": "Atmospheric testing not completed",
            "potential_consequence": "Fatality",
        },
        risk_score=60,
        sif_level="MEDIUM",
        confidence=0.8,
        status="PENDING",
    )
    db.add(analysis)
    db.commit()

    try:
        graph = build_causal_graph(
            db=db,
            report_id=report.id,
        )

        assert graph.report_id == report.id
        assert len(graph.nodes) == 5
        assert len(graph.edges) == 4

        node_types = {node.type for node in graph.nodes}

        assert node_types == {
            "activity",
            "hazard",
            "barrier",
            "barrier_failure",
            "consequence",
        }

        node_labels = {node.label for node in graph.nodes}

        assert node_labels == {
        "Confined space entry",
        "Confined space",
        "Atmospheric testing",
        "Atmospheric testing not completed",
        "Fatality",
    }

        assert graph.edges[0].source == "activity"
        assert graph.edges[0].target == "hazard"

        assert graph.edges[1].source == "hazard"
        assert graph.edges[1].target == "barrier"

        assert graph.edges[2].source == "barrier"
        assert graph.edges[2].target == "barrier_failure"

        assert graph.edges[3].source == "barrier_failure"
        assert graph.edges[3].target == "consequence"


    finally:
        db.delete(analysis)
        db.delete(report)
        db.commit()
        db.close()


def test_build_causal_graph_missing_analysis():
    db = SessionLocal()

    missing_report_id = uuid4()

    try:
        with pytest.raises(ValueError, match="Analysis not found"):
            build_causal_graph(
                db=db,
                report_id=missing_report_id,
            )
    finally:
        db.close()
