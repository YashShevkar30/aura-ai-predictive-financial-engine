from fastapi import FastAPI

from app.schemas import ExpensePredictionRequest, ExpensePredictionResponse
from app.services.data import generate_demo_dataset
from app.services.predictor import ExpensePredictor

app = FastAPI(title="Aura Predictive Financial Engine", version="1.0.0")
predictor = ExpensePredictor()


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
    return predictor.predict(request)
