from pydantic import BaseModel, Field


class ExpensePredictionRequest(BaseModel):
    monthly_income: float = Field(gt=0)
    monthly_rent: float = Field(ge=0)
    monthly_food: float = Field(ge=0)
    monthly_transport: float = Field(ge=0)
    monthly_entertainment: float = Field(ge=0)
    savings_goal_monthly: float = Field(ge=0, description="Target amount user wants to save each month")
    credit_score: int = Field(ge=300, le=850)


class PredictionBreakdown(BaseModel):
    manual_category_sum: float
    weighted_model_sum_before_clamp: float
    projected_minus_manual_delta: float
    components: dict[str, float]


class SuggestedBudgetPlan(BaseModel):
    monthly_rent: float
    monthly_food: float
    monthly_transport: float
    monthly_entertainment: float
    expected_total_category_spend: float


class ExpensePredictionResponse(BaseModel):
    predicted_monthly_expense: float
    projected_monthly_savings: float
    risk_band: str
    savings_goal_status: str
    savings_gap: float
    confidence: float
    recommendations: list[str]
    suggested_budget_plan: SuggestedBudgetPlan
    breakdown: PredictionBreakdown


class ScenarioCompareRequest(BaseModel):
    scenario_a: ExpensePredictionRequest
    scenario_b: ExpensePredictionRequest


class ScenarioComparisonDelta(BaseModel):
    expense_delta_b_minus_a: float
    savings_delta_b_minus_a: float
    confidence_delta_b_minus_a: float


class ScenarioCompareResponse(BaseModel):
    scenario_a_result: ExpensePredictionResponse
    scenario_b_result: ExpensePredictionResponse
    delta: ScenarioComparisonDelta
    better_scenario_for_goal: str


class PredictionHistoryItem(BaseModel):
    id: int
    created_at: str
    input: ExpensePredictionRequest
    output: ExpensePredictionResponse


class PredictionHistoryResponse(BaseModel):
    items: list[PredictionHistoryItem]
