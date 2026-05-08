from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_prediction_contract() -> None:
    payload = {
        "monthly_income": 8500,
        "monthly_rent": 2400,
        "monthly_food": 650,
        "monthly_transport": 320,
        "monthly_entertainment": 450,
        "credit_score": 760,
    }
    response = client.post("/predict", json=payload)
    body = response.json()
    assert response.status_code == 200
    assert "predicted_monthly_expense" in body
    assert body["risk_band"] in {"LOW", "MEDIUM", "HIGH"}
    assert 0.7 <= body["confidence"] <= 0.95
