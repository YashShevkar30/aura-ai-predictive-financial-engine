from pydantic import BaseModel, Field


class ExpensePredictionRequest(BaseModel):
    monthly_income: float = Field(gt=0)
    monthly_rent: float = Field(ge=0)
    monthly_food: float = Field(ge=0)
    monthly_transport: float = Field(ge=0)
    monthly_entertainment: float = Field(ge=0)
    credit_score: int = Field(ge=300, le=850)


class ExpensePredictionResponse(BaseModel):
    predicted_monthly_expense: float
    risk_band: str
    confidence: float
