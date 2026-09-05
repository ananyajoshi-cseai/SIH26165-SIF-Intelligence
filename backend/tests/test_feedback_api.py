import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_feedback_endpoint_recalculates_and_validates():
    analyze_response = client.post(
        "/api/v1/reports/analyze",
        json={
            "site": "HITL API Test Plant",
            "text": "Worker entered a confined space without atmospheric testing.",
        },
    )

    assert analyze_response.status_code == 201

    analyze_data = analyze_response.json()
    report_id = analyze_data["report_id"]

    assert analyze_data["risk_score"] == 60
    assert analyze_data["risk_level"] == "MEDIUM"

    feedback_response = client.put(
        f"/api/v1/reports/{report_id}/feedback",
        json={
            "extracted_data": {
                "activity": "Confined space entry",
                "hazard": "Confined space",
                "exposure": "Worker in line of fire",
                "barrier": "Atmospheric testing",
                "barrier_failure": "Atmospheric testing not completed",
                "potential_consequence": "Fatality",
            }
        },
    )

    assert feedback_response.status_code == 200

    feedback_data = feedback_response.json()

    assert feedback_data["report_id"] == report_id
    assert feedback_data["risk_score"] == 100
    assert feedback_data["risk_level"] == "HIGH"
    assert feedback_data["confidence"] == 0.8
    assert feedback_data["status"] == "VALIDATED"

    # Clean up the report created by the integration test.
    delete_response = client.delete(
        f"/api/v1/reports/{report_id}"
    )

    assert delete_response.status_code == 204


def test_feedback_endpoint_returns_404_for_missing_analysis():
    missing_report_id = uuid.uuid4()

    response = client.put(
        f"/api/v1/reports/{missing_report_id}/feedback",
        json={
            "extracted_data": {
                "activity": "Test activity",
                "hazard": "Unknown",
                "exposure": "Unknown",
                "barrier": "Unknown",
                "barrier_failure": "Unknown",
                "potential_consequence": "Unknown",
            }
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Analysis not found"