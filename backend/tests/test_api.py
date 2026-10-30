import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_admin():
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "CyberAdmin2026!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Super Administrator"

def test_dashboard_summary():
    # Login to get token
    login_res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "CyberAdmin2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    assert "metrics" in summary
    assert "charts" in summary
    assert summary["metrics"]["total_devices"] >= 6
    assert summary["metrics"]["total_vulnerabilities"] >= 4

def test_integrations_status():
    login_res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "CyberAdmin2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/integrations/status", headers=headers)
    assert res.status_code == 200
    tools = res.json()
    assert len(tools) >= 10
    names = [t["name"] for t in tools]
    assert any("Nmap" in n for n in names)
    assert any("Scapy" in n for n in names)
    assert any("Suricata" in n for n in names)
