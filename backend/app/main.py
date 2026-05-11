from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    ExpensePredictionRequest,
    ExpensePredictionResponse,
    PredictionHistoryResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    ScenarioComparisonDelta,
)
from app.services.data import generate_demo_dataset
from app.services.history_store import PredictionHistoryStore
from app.services.predictor import ExpensePredictor

app = FastAPI(title="Aura Predictive Financial Engine", version="1.0.0")
predictor = ExpensePredictor()
history_store = PredictionHistoryStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dataset/sample")
def dataset_sample(size: int = 15) -> dict[str, object]:
    capped_size = min(max(size, 1), 100)
    rows = generate_demo_dataset(size=capped_size)
    return {"rows": rows, "size": capped_size}


@app.post("/predict", response_model=ExpensePredictionResponse)
def predict_expense(request: ExpensePredictionRequest) -> ExpensePredictionResponse:
    prediction = predictor.predict(request)
    history_store.save(request, prediction)
    return prediction


@app.post("/compare", response_model=ScenarioCompareResponse)
def compare_scenarios(request: ScenarioCompareRequest) -> ScenarioCompareResponse:
    result_a = predictor.predict(request.scenario_a)
    result_b = predictor.predict(request.scenario_b)

    goal_gap_a = result_a.savings_gap
    goal_gap_b = result_b.savings_gap
    if goal_gap_a < goal_gap_b:
        better = "A"
    elif goal_gap_b < goal_gap_a:
        better = "B"
    elif result_a.projected_monthly_savings >= result_b.projected_monthly_savings:
        better = "A"
    else:
        better = "B"

    return ScenarioCompareResponse(
        scenario_a_result=result_a,
        scenario_b_result=result_b,
        delta=ScenarioComparisonDelta(
            expense_delta_b_minus_a=round(
                result_b.predicted_monthly_expense - result_a.predicted_monthly_expense, 2
            ),
            savings_delta_b_minus_a=round(
                result_b.projected_monthly_savings - result_a.projected_monthly_savings, 2
            ),
            confidence_delta_b_minus_a=round(result_b.confidence - result_a.confidence, 3),
        ),
        better_scenario_for_goal=better,
    )


@app.get("/history", response_model=PredictionHistoryResponse)
def prediction_history(limit: int = 20) -> PredictionHistoryResponse:
    return PredictionHistoryResponse(items=history_store.list_recent(limit=limit))
