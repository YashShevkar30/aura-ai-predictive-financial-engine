from fastapi import APIRouter
from app.services.data import generate_demo_dataset

router = APIRouter()

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@router.get("/dataset/sample")
def dataset_sample(size: int = 15) -> dict[str, object]:
    capped_size = min(max(size, 1), 100)
    rows = generate_demo_dataset(size=capped_size)
    return {"rows": rows, "size": capped_size}
