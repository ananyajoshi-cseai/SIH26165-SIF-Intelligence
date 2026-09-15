"""
Dev 6 — E2E integration tests.
Run from the backend/ directory with the server running:
    pytest tests/test_e2e.py -v
"""

import pytest
import requests

BASE = "http://127.0.0.1:8000/api/v1"


def test_health_check():
    r = requests.get(f"{BASE}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_analyze_report_returns_structured_json():
    payload = {
        "site": "Rig 4",
        "text": "During lifting operations, a worker entered the exclusion zone beneath a suspended drill pipe. No barricade was in place.",
    }
    r = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert "report_id" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "confidence" in data
    assert "extraction" in data
    ext = data["extraction"]
    assert "activity" in ext
    assert "hazard" in ext
    assert "barrier_failure" in ext
    assert "potential_consequence" in ext


def test_analyze_high_risk_report():
    payload = {
        "site": "Site A",
        "text": "Worker entered confined space without atmospheric testing. H2S levels unknown.",
    }
    r = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["risk_level"] in ("HIGH", "MEDIUM", "LOW")
    assert 0 <= data["risk_score"] <= 100
    assert 0 <= data["confidence"] <= 1


def test_analyze_empty_text_returns_400():
    payload = {"site": "Site A", "text": ""}
    r = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert r.status_code in (400, 422)


def test_analyze_gibberish_does_not_crash():
    payload = {"site": "Unknown", "text": "asdfjkl qwerty 123 !!!"}
    r = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert "risk_score" in data


def test_get_reports_list():
    r = requests.get(f"{BASE}/reports")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_csv_upload():
    import io
    csv_content = (
        "report_id,date,site,department,report_text,is_synthetic\n"
        "e2e-test-001,2026-09-01,Test-Site,Operations,"
        "Worker bypassed interlock on pump during maintenance.,True\n"
    )
    files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    r = requests.post(f"{BASE}/reports/upload", files=files)
    assert r.status_code == 201
    data = r.json()
    assert data["created"] >= 1


def test_similar_reports_endpoint():
    # First create a report to get a valid ID
    payload = {"site": "Site B", "text": "Gas leakage detected near hot work permit area."}
    create = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert create.status_code == 201
    report_id = create.json()["report_id"]

    r = requests.get(f"{BASE}/reports/{report_id}/similar")
    assert r.status_code == 200
    data = r.json()
    assert "similar_reports" in data
    assert isinstance(data["similar_reports"], list)


def test_dashboard_summary():
    r = requests.get(f"{BASE}/reports/dashboard-summary")
    assert r.status_code == 200
    data = r.json()
    assert "total_reports" in data


def test_hitl_feedback():
    # Create a report first
    payload = {"site": "Site D", "text": "LOTO not applied before maintenance on energized pump."}
    create = requests.post(f"{BASE}/reports/analyze", json=payload)
    assert create.status_code == 201
    report_id = create.json()["report_id"]

    feedback = {
        "extracted_data": {
            "activity": "Maintenance",
            "hazard": "Electrical energy",
            "exposure": "Worker exposed to energized equipment",
            "barrier": "LOTO",
            "barrier_failure": "LOTO not applied",
            "potential_consequence": "Fatality",
        }
    }
    r = requests.put(f"{BASE}/reports/{report_id}/feedback", json=feedback)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "VALIDATED"