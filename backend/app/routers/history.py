from fastapi import APIRouter
from app.schemas import PredictionHistoryResponse
from app.services.history_store import PredictionHistoryStore

router = APIRouter()
history_store = PredictionHistoryStore()

@router.get("/history", response_model=PredictionHistoryResponse)
def prediction_history(limit: int = 20) -> PredictionHistoryResponse:
    return PredictionHistoryResponse(items=history_store.list_recent(limit=limit))
