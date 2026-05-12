from fastapi import APIRouter

from app.schemas import (
    ExpensePredictionRequest, ExpensePredictionResponse,
    ScenarioCompareRequest, ScenarioCompareResponse, ScenarioComparisonDelta,
)
from app.services.predictor import ExpensePredictor
from app.services.history_store import PredictionHistoryStore
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
predictor = ExpensePredictor()
history_store = PredictionHistoryStore()

@router.post("/predict", response_model=ExpensePredictionResponse)
def predict_expense(request: ExpensePredictionRequest) -> ExpensePredictionResponse:
    prediction = predictor.predict(request)
    history_store.save(request, prediction)
    return prediction

@router.post("/compare", response_model=ScenarioCompareResponse)
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
