from dataclasses import dataclass

import numpy as np

from app.schemas import (
    ExpensePredictionRequest,
    ExpensePredictionResponse,
    PredictionBreakdown,
    SuggestedBudgetPlan,
)


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
        manual_category_sum = (
            request.monthly_rent
            + request.monthly_food
            + request.monthly_transport
            + request.monthly_entertainment
        )
        weighted_model_sum_before_clamp = (
            w.bias
            + (w.income_factor * request.monthly_income)
            + (w.rent_factor * request.monthly_rent)
            + (w.food_factor * request.monthly_food)
            + (w.transport_factor * request.monthly_transport)
            + (w.entertainment_factor * request.monthly_entertainment)
            + (w.credit_factor * request.credit_score)
        )
        predicted = float(np.clip(weighted_model_sum_before_clamp, 0, request.monthly_income * 1.5))
        projected_savings = max(request.monthly_income - predicted, 0.0)
        savings_goal_status = "ON_TRACK" if projected_savings >= request.savings_goal_monthly else "BEHIND_GOAL"
        savings_gap = max(request.savings_goal_monthly - projected_savings, 0.0)
        confidence = float(np.clip(0.72 + ((request.credit_score - 300) / 2000), 0.7, 0.95))
        suggested_budget_plan = self._suggested_budget_plan(request, savings_gap)
        recommendations = self._recommendations(request, predicted, projected_savings, savings_gap)

        return ExpensePredictionResponse(
            predicted_monthly_expense=round(predicted, 2),
            projected_monthly_savings=round(projected_savings, 2),
            risk_band=self._risk_band(predicted, request.monthly_income),
            savings_goal_status=savings_goal_status,
            savings_gap=round(savings_gap, 2),
            confidence=round(confidence, 3),
            recommendations=recommendations,
            suggested_budget_plan=suggested_budget_plan,
            breakdown=PredictionBreakdown(
                manual_category_sum=round(manual_category_sum, 2),
                weighted_model_sum_before_clamp=round(weighted_model_sum_before_clamp, 2),
                projected_minus_manual_delta=round(predicted - manual_category_sum, 2),
                components={
                    "bias": round(w.bias, 2),
                    "income_term": round(w.income_factor * request.monthly_income, 2),
                    "rent_term": round(w.rent_factor * request.monthly_rent, 2),
                    "food_term": round(w.food_factor * request.monthly_food, 2),
                    "transport_term": round(w.transport_factor * request.monthly_transport, 2),
                    "entertainment_term": round(w.entertainment_factor * request.monthly_entertainment, 2),
                    "credit_adjustment_term": round(w.credit_factor * request.credit_score, 2),
                },
            ),
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

    def _recommendations(
        self,
        request: ExpensePredictionRequest,
        predicted_expense: float,
        projected_savings: float,
        savings_gap: float,
    ) -> list[str]:
        recommendations: list[str] = []
        expense_ratio = predicted_expense / max(request.monthly_income, 1)

        if savings_gap > 0:
            recommendations.append(
                f"You are ${savings_gap:.2f} below your monthly savings goal. "
                "Try reducing flexible categories first."
            )
            entertainment_cut = min(request.monthly_entertainment * 0.3, savings_gap)
            if entertainment_cut > 0:
                recommendations.append(
                    f"Potential step: lower entertainment by about ${entertainment_cut:.2f} next month."
                )
            food_cut = min(request.monthly_food * 0.15, max(savings_gap - entertainment_cut, 0))
            if food_cut > 0:
                recommendations.append(
                    f"Potential step: optimize food spend by about ${food_cut:.2f} using weekly budgets."
                )
        else:
            recommendations.append("You are currently meeting your monthly savings goal.")

        if expense_ratio >= 0.75:
            recommendations.append(
                "High expense ratio detected. Prioritize fixed-cost reduction strategies (rent or transport)."
            )
        elif expense_ratio >= 0.55:
            recommendations.append(
                "Moderate expense ratio detected. Track weekly category budgets to stay on target."
            )
        else:
            recommendations.append(
                "Healthy expense ratio. Consider increasing your savings goal incrementally."
            )

        if request.credit_score < 650:
            recommendations.append(
                "Lower credit score may increase financial pressure; focus on timely payments and utilization reduction."
            )
        elif request.credit_score >= 750:
            recommendations.append(
                "Strong credit profile supports better financial resilience. Maintain consistent repayment behavior."
            )

        recommendations.append(
            f"Projected monthly savings based on this scenario: ${projected_savings:.2f}."
        )
        return recommendations

    def _suggested_budget_plan(self, request: ExpensePredictionRequest, savings_gap: float) -> SuggestedBudgetPlan:
        adjusted = {
            "monthly_rent": request.monthly_rent,
            "monthly_food": request.monthly_food,
            "monthly_transport": request.monthly_transport,
            "monthly_entertainment": request.monthly_entertainment,
        }
        remaining_gap = max(savings_gap, 0.0)

        # Reduce flexible spend first before touching fixed costs.
        reduction_plan = [
            ("monthly_entertainment", 0.40),
            ("monthly_food", 0.20),
            ("monthly_transport", 0.15),
            ("monthly_rent", 0.10),
        ]

        for key, max_cut_ratio in reduction_plan:
            if remaining_gap <= 0:
                break
            current = adjusted[key]
            max_cut = current * max_cut_ratio
            applied_cut = min(max_cut, remaining_gap)
            adjusted[key] = round(max(current - applied_cut, 0.0), 2)
            remaining_gap -= applied_cut

        total = (
            adjusted["monthly_rent"]
            + adjusted["monthly_food"]
            + adjusted["monthly_transport"]
            + adjusted["monthly_entertainment"]
        )
        return SuggestedBudgetPlan(
            monthly_rent=adjusted["monthly_rent"],
            monthly_food=adjusted["monthly_food"],
            monthly_transport=adjusted["monthly_transport"],
            monthly_entertainment=adjusted["monthly_entertainment"],
            expected_total_category_spend=round(total, 2),
        )
