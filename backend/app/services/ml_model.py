from __future__ import annotations

import csv
from datetime import datetime, UTC
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import train_test_split

from app.schemas import ExpensePredictionRequest


FEATURE_NAMES = [
    "monthly_income",
    "monthly_rent",
    "monthly_food",
    "monthly_transport",
    "monthly_entertainment",
    "credit_score",
]

MODEL_DIR = Path(__file__).resolve().parents[2] / "model"
MODEL_PATH = MODEL_DIR / "expense_model.joblib"
MODEL_SCHEMA_VERSION = 6
DEFAULT_EXPENSE_DATASET_PATH = Path("/Users/spartan/Downloads/Expenses Data Set.csv")


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


def _transform_features(x: np.ndarray) -> np.ndarray:
    transformed = x.copy()
    # Use credit risk (higher means worse profile) for stable positive-constrained fitting.
    transformed[:, 5] = (850.0 - transformed[:, 5]) / 100.0
    return transformed


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


def _dataset_from_expense_csv(dataset_path: Path) -> tuple[np.ndarray, np.ndarray] | None:
    if not dataset_path.exists():
        return None
    base_rows = _aggregate_monthly_rows_from_expenses(dataset_path)
    if len(base_rows) < 8:
        return None
    return _augment_rows(base_rows)


def train_and_save_model(model_path: Path = MODEL_PATH) -> dict:
    dataset_path = DEFAULT_EXPENSE_DATASET_PATH
    dataset = _dataset_from_expense_csv(dataset_path)
    data_source = "synthetic_generated"
    if dataset is None:
        x_all, y_all = _synthetic_training_dataset()
    else:
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


def ensure_model(model_path: Path = MODEL_PATH) -> dict:
    if model_path.exists():
        payload = joblib.load(model_path)
        if payload.get("schema_version") == MODEL_SCHEMA_VERSION:
            return payload
    return train_and_save_model(model_path=model_path)


def predict_with_contributions(
    model_payload: dict, request: ExpensePredictionRequest
) -> tuple[float, dict[str, float], dict[str, float]]:
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
