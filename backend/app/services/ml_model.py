from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import Ridge

from app.schemas import ExpensePredictionRequest
from app.config import MODEL_PATH, MODEL_SCHEMA_VERSION

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "monthly_income",
    "monthly_rent",
    "monthly_food",
    "monthly_transport",
    "monthly_entertainment",
    "credit_score",
]

def _transform_features(x: np.ndarray) -> np.ndarray:
    transformed = x.copy()
    # Use credit risk (higher means worse profile) for stable positive-constrained fitting.
    transformed[:, 5] = (850.0 - transformed[:, 5]) / 100.0
    return transformed

def ensure_model(model_path: Path = MODEL_PATH) -> dict:
    """Load a trained model from disk, or train a new one if missing."""
    if model_path.exists():
        payload = joblib.load(model_path)
        if payload.get("schema_version") == MODEL_SCHEMA_VERSION:
            logger.info("Loaded existing model from disk.")
            return payload
    logger.info("Model missing or incompatible, initiating training.")
    from app.services.training import train_and_save_model
    return train_and_save_model(model_path=model_path)

def predict_with_contributions(
    model_payload: dict, request: ExpensePredictionRequest
) -> tuple[float, dict[str, float], dict[str, float]]:
    """Run inference and return the raw adjustment, component contributions, and coefficient terms."""
    model: Ridge = model_payload["model"]
    vector_raw = np.array(
        [
            request.monthly_income,
            request.monthly_rent,
            request.monthly_food,
            request.monthly_transport,
            request.monthly_entertainment,
            float(request.credit_score),
        ],
        dtype=float,
    )
    vector_model = vector_raw.copy()
    vector_model[5] = (850.0 - vector_model[5]) / 100.0

    raw_adjustment_prediction = float(model.predict(vector_model.reshape(1, -1))[0])
    coef = model.coef_
    intercept_raw = float(model.intercept_)
    credit_score_coef = -float(coef[5]) / 100.0
    bias_adjusted = intercept_raw + (8.5 * float(coef[5]))

    components = {
        "bias": round(bias_adjusted, 2),
        "income_term": round(float(coef[0] * vector_raw[0]), 2),
        "rent_term": round(float(coef[1] * vector_raw[1]), 2),
        "food_term": round(float(coef[2] * vector_raw[2]), 2),
        "transport_term": round(float(coef[3] * vector_raw[3]), 2),
        "entertainment_term": round(float(coef[4] * vector_raw[4]), 2),
        "credit_adjustment_term": round(float(credit_score_coef * vector_raw[5]), 2),
    }
    coefficients = {
        "bias": round(bias_adjusted, 6),
        "income": round(float(coef[0]), 6),
        "rent": round(float(coef[1]), 6),
        "food": round(float(coef[2]), 6),
        "transport": round(float(coef[3]), 6),
        "entertainment": round(float(coef[4]), 6),
        "credit_score": round(credit_score_coef, 6),
    }
    return raw_adjustment_prediction, components, coefficients
