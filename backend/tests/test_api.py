import pytest
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_prediction_contract(client) -> None:
    payload = {
        "monthly_income": 8500,
        "monthly_rent": 2400,
        "monthly_food": 650,
        "monthly_transport": 320,
        "monthly_entertainment": 450,
        "savings_goal_monthly": 1200,
        "credit_score": 760,
    }
    response = client.post("/predict", json=payload)
    body = response.json()
    assert response.status_code == 200
    assert "predicted_monthly_expense" in body
    assert "projected_monthly_savings" in body
    assert body["risk_band"] in {"LOW", "MEDIUM", "HIGH"}
    assert body["savings_goal_status"] in {"ON_TRACK", "BEHIND_GOAL"}
    assert body["savings_gap"] >= 0
    assert 0.7 <= body["confidence"] <= 0.95
    assert isinstance(body["recommendations"], list)
    assert len(body["recommendations"]) >= 1
    assert "suggested_budget_plan" in body
    assert body["suggested_budget_plan"]["expected_total_category_spend"] >= 0
    assert "breakdown" in body
    assert body["breakdown"]["predictor_type"] == "linear_regression_ml"
    assert body["breakdown"]["manual_category_sum"] >= 0
    assert body["breakdown"]["predicted_before_floor"] >= 0
    assert isinstance(body["breakdown"]["floor_applied_to_manual_sum"], bool)
    assert body["predicted_monthly_expense"] >= body["breakdown"]["manual_category_sum"]
    assert "income_term" in body["breakdown"]["components"]
    assert "income" in body["breakdown"]["coefficient_terms"]


def test_compare_endpoint_returns_delta_and_better_scenario(client) -> None:
    payload = {
        "scenario_a": {
            "monthly_income": 7000,
            "monthly_rent": 1900,
            "monthly_food": 700,
            "monthly_transport": 400,
            "monthly_entertainment": 500,
            "savings_goal_monthly": 1400,
            "credit_score": 730,
        },
        "scenario_b": {
            "monthly_income": 7000,
            "monthly_rent": 1700,
            "monthly_food": 620,
            "monthly_transport": 350,
            "monthly_entertainment": 350,
            "savings_goal_monthly": 1400,
            "credit_score": 730,
        },
    }

    response = client.post("/compare", json=payload)
    body = response.json()
    assert response.status_code == 200
    assert "delta" in body
    assert body["better_scenario_for_goal"] in {"A", "B"}
    assert "scenario_a_result" in body
    assert "scenario_b_result" in body


def test_history_endpoint_returns_recent_predictions(client) -> None:
    payload = {
        "monthly_income": 6000,
        "monthly_rent": 1800,
        "monthly_food": 620,
        "monthly_transport": 280,
        "monthly_entertainment": 360,
        "savings_goal_monthly": 1200,
        "credit_score": 710,
    }
    client.post("/predict", json=payload)
    response = client.get("/history?limit=5")
    body = response.json()

    assert response.status_code == 200
    assert "items" in body
    assert isinstance(body["items"], list)
    assert len(body["items"]) >= 1

# --- Edge Cases ---
def test_minimum_income(client):
    """Income just above 0 should still return valid prediction."""
    payload = {
        "monthly_income": 1,
        "monthly_rent": 0, "monthly_food": 0,
        "monthly_transport": 0, "monthly_entertainment": 0,
        "savings_goal_monthly": 0, "credit_score": 300,
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 200
    assert r.json()["risk_band"] in {"LOW", "MEDIUM", "HIGH"}

def test_max_credit_score(client):
    """Credit score at ceiling (850)."""
    payload = {
        "monthly_income": 10000, "monthly_rent": 3000,
        "monthly_food": 800, "monthly_transport": 400,
        "monthly_entertainment": 600,
        "savings_goal_monthly": 2000, "credit_score": 850,
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 200
    assert r.json()["confidence"] <= 0.95

def test_zero_savings_goal(client):
    """Zero savings goal → always ON_TRACK."""
    payload = {
        "monthly_income": 5000, "monthly_rent": 1500,
        "monthly_food": 500, "monthly_transport": 200,
        "monthly_entertainment": 300,
        "savings_goal_monthly": 0, "credit_score": 700,
    }
    r = client.post("/predict", json=payload)
    assert r.json()["savings_goal_status"] == "ON_TRACK"

def test_invalid_credit_score_rejected(client):
    """Credit score below 300 should be rejected by Pydantic."""
    payload = {
        "monthly_income": 5000, "monthly_rent": 1500,
        "monthly_food": 500, "monthly_transport": 200,
        "monthly_entertainment": 300,
        "savings_goal_monthly": 500, "credit_score": 100,
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 422

def test_dataset_sample(client):
    r = client.get("/dataset/sample?size=5")
    assert r.status_code == 200
    assert len(r.json()["rows"]) == 5
