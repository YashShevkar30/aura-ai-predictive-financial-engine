from dataclasses import dataclass

import numpy as np

from app.schemas import ExpensePredictionRequest, ExpensePredictionResponse


@dataclass(frozen=True)
class ModelWeights:
    bias: float = 180.0
    income_factor: float = 0.26
    rent_factor: float = 0.95
    food_factor: float = 1.08
    transport_factor: float = 1.02
    entertainment_factor: float = 1.15
    credit_factor: float = -0.08


class ExpensePredictor:
    def __init__(self, weights: ModelWeights | None = None) -> None:
        self.weights = weights or ModelWeights()

    def predict(self, request: ExpensePredictionRequest) -> ExpensePredictionResponse:
        w = self.weights
        predicted = (
            w.bias
            + (w.income_factor * request.monthly_income)
            + (w.rent_factor * request.monthly_rent)
            + (w.food_factor * request.monthly_food)
            + (w.transport_factor * request.monthly_transport)
            + (w.entertainment_factor * request.monthly_entertainment)
            + (w.credit_factor * request.credit_score)
        )
        predicted = float(np.clip(predicted, 0, request.monthly_income * 1.5))
        confidence = float(np.clip(0.72 + ((request.credit_score - 300) / 2000), 0.7, 0.95))

        return ExpensePredictionResponse(
            predicted_monthly_expense=round(predicted, 2),
            risk_band=self._risk_band(predicted, request.monthly_income),
            confidence=round(confidence, 3),
        )

    @staticmethod
    def _risk_band(predicted_expense: float, income: float) -> str:
        if income <= 0:
            return "HIGH"
        ratio = predicted_expense / income
        if ratio < 0.55:
            return "LOW"
        if ratio < 0.75:
            return "MEDIUM"
        return "HIGH"
