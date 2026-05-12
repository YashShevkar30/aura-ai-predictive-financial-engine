from __future__ import annotations

import csv
import logging
from datetime import datetime, UTC
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import train_test_split

from app.config import MODEL_PATH, MODEL_SCHEMA_VERSION, DATASET_PATH
from app.services.ml_model import FEATURE_NAMES, _transform_features

logger = logging.getLogger(__name__)

def _synthetic_training_dataset(samples: int = 5000, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)

    income = rng.uniform(2500, 18000, samples)
    rent = income * rng.uniform(0.18, 0.42, samples)
    food = income * rng.uniform(0.07, 0.17, samples)
    transport = income * rng.uniform(0.02, 0.11, samples)
    entertainment = income * rng.uniform(0.02, 0.16, samples)
    credit = rng.integers(480, 840, samples).astype(float)

    # Synthetic target emulates spending behavior with moderate interaction and noise.
    target_total = (
        210
        + (0.22 * income)
        + (0.92 * rent)
        + (1.04 * food)
        + (1.01 * transport)
        + (1.10 * entertainment)
        - (0.06 * credit)
        + (0.000007 * income * rent)
        + rng.normal(0, 170, samples)
    )
    target_total = np.clip(target_total, 0, income * 1.45)
    manual_sum = rent + food + transport + entertainment
    target_adjustment = target_total - manual_sum

    features = np.column_stack([income, rent, food, transport, entertainment, credit])
    return features, target_adjustment


def _aggregate_monthly_rows_from_expenses(dataset_path: Path) -> list[dict[str, float]]:
    monthly: dict[str, dict[str, float]] = {}
    with dataset_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_raw = row.get("Posting Date", "").strip()
            if not date_raw:
                continue
            month_key = date_raw[: date_raw.rfind("/") + 1] + date_raw[-2:]
            amount = float(row.get("Amount", "0") or 0)
            category = (row.get("Category") or "").strip().lower()
            description = (row.get("Description") or "").strip().lower()

            bucket = monthly.setdefault(
                month_key,
                {
                    "monthly_income": 0.0,
                    "monthly_rent": 0.0,
                    "monthly_food": 0.0,
                    "monthly_transport": 0.0,
                    "monthly_entertainment": 0.0,
                    "target_expense": 0.0,
                },
            )

            if amount > 0:
                if category in {"direct deposit", "wire transfer"}:
                    bucket["monthly_income"] += amount
                continue

            expense = abs(amount)
            bucket["target_expense"] += expense

            if category == "bills" and "rent" in description:
                bucket["monthly_rent"] += expense
            elif category in {"food", "groceries"}:
                bucket["monthly_food"] += expense
            elif category in {"uber/lyft", "travel"}:
                bucket["monthly_transport"] += expense
            elif category in {"entertainment", "merchandise"}:
                bucket["monthly_entertainment"] += expense

    rows: list[dict[str, float]] = []
    for values in monthly.values():
        total_expense = values["target_expense"]
        if total_expense <= 0:
            continue

        income = values["monthly_income"]
        if income <= 0:
            income = total_expense * 1.35

        discretionary = (
            values["monthly_food"] + values["monthly_transport"] + values["monthly_entertainment"]
        )
        discretionary_ratio = discretionary / max(total_expense, 1)
        savings_rate = (income - total_expense) / max(income, 1)
        credit_score = np.clip(
            660 + (140 * savings_rate) - (40 * max(discretionary_ratio - 0.45, 0)),
            500,
            830,
        )

        rows.append(
            {
                "monthly_income": float(income),
                "monthly_rent": float(values["monthly_rent"]),
                "monthly_food": float(values["monthly_food"]),
                "monthly_transport": float(values["monthly_transport"]),
                "monthly_entertainment": float(values["monthly_entertainment"]),
                "credit_score": float(credit_score),
                "target_expense": float(total_expense),
            }
        )
    return rows


def _augment_rows(base_rows: list[dict[str, float]], repeats: int = 120, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    features: list[list[float]] = []
    target: list[float] = []

    for row in base_rows:
        for _ in range(repeats):
            income = row["monthly_income"] * float(np.clip(rng.normal(1.0, 0.07), 0.75, 1.35))
            rent = row["monthly_rent"] * float(np.clip(rng.normal(1.0, 0.06), 0.7, 1.4))
            food = row["monthly_food"] * float(np.clip(rng.normal(1.0, 0.08), 0.65, 1.5))
            transport = row["monthly_transport"] * float(np.clip(rng.normal(1.0, 0.08), 0.6, 1.5))
            entertainment = row["monthly_entertainment"] * float(np.clip(rng.normal(1.0, 0.1), 0.55, 1.6))
            credit_score = float(
                np.clip(row["credit_score"] + rng.normal(0, 18), 450, 850)
            )

            synthetic_total = (
                row["target_expense"] * float(np.clip(rng.normal(1.0, 0.08), 0.7, 1.45))
                + (0.03 * (income - row["monthly_income"]))
            )
            synthetic_total = float(np.clip(synthetic_total, 0, income * 1.5))
            manual_sum = rent + food + transport + entertainment
            synthetic_adjustment = synthetic_total - manual_sum

            features.append([income, rent, food, transport, entertainment, credit_score])
            target.append(synthetic_adjustment)

    return np.array(features, dtype=float), np.array(target, dtype=float)


def _dataset_from_expense_csv(dataset_path: Path | None) -> tuple[np.ndarray, np.ndarray] | None:
    if dataset_path is None or not dataset_path.exists() or not dataset_path.is_file():
        return None
    try:
        base_rows = _aggregate_monthly_rows_from_expenses(dataset_path)
        if len(base_rows) < 8:
            return None
        return _augment_rows(base_rows)
    except Exception as e:
        logger.warning(f"Failed to load real dataset: {e}")
        return None


def train_and_save_model(model_path: Path = MODEL_PATH) -> dict:
    """Train a Ridge regression model and persist it to disk."""
    dataset_path = DATASET_PATH if DATASET_PATH and DATASET_PATH != Path(".") else None
    dataset = _dataset_from_expense_csv(dataset_path)
    data_source = "synthetic_generated"
    if dataset is None:
        logger.info("Training on synthetic dataset")
        x_all, y_all = _synthetic_training_dataset()
    else:
        logger.info(f"Training on real dataset from {dataset_path}")
        x_all, y_all = dataset
        data_source = f"kaggle_expenses_csv:{dataset_path}"

    x_train, x_test, y_train, y_test = train_test_split(
        x_all, y_all, test_size=0.2, random_state=42
    )
    x_train_t = _transform_features(x_train)
    x_test_t = _transform_features(x_test)

    model = Ridge(alpha=5.0, random_state=42)
    model.fit(x_train_t, y_train)
    y_pred = model.predict(x_test_t)

    metrics = {
        "mae": float(mean_absolute_error(y_test, y_pred)),
        "rmse": float(root_mean_squared_error(y_test, y_pred)),
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
    }
    
    logger.info(f"Training complete. MAE={metrics['mae']:.2f}, RMSE={metrics['rmse']:.2f}")

    payload = {
        "schema_version": MODEL_SCHEMA_VERSION,
        "model": model,
        "feature_names": FEATURE_NAMES,
        "trained_at": datetime.now(UTC).isoformat(),
        "data_source": data_source,
        "metrics": metrics,
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, model_path)
    return payload
