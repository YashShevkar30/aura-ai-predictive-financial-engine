import os
from pathlib import Path

# -- Paths --
BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "expense_model.joblib"
DB_PATH = BASE_DIR / "aura_history.db"
DATASET_PATH = Path(os.getenv("AURA_DATASET_PATH", ""))

# -- Model --
MODEL_SCHEMA_VERSION = 6

# -- CORS --
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# -- Logging --
LOG_LEVEL = os.getenv("AURA_LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
