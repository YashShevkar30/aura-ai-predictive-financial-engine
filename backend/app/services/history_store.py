import json
import sqlite3
from pathlib import Path

from pydantic import ValidationError

from app.schemas import ExpensePredictionRequest, ExpensePredictionResponse, PredictionHistoryItem


class PredictionHistoryStore:
    def __init__(self, db_path: str = "aura_history.db") -> None:
        self.db_path = Path(db_path)
        self._ensure_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _ensure_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS prediction_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    input_json TEXT NOT NULL,
                    output_json TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def save(self, prediction_input: ExpensePredictionRequest, prediction_output: ExpensePredictionResponse) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO prediction_history (input_json, output_json)
                VALUES (?, ?)
                """,
                (
                    json.dumps(prediction_input.model_dump()),
                    json.dumps(prediction_output.model_dump()),
                ),
            )
            conn.commit()

    def list_recent(self, limit: int = 20) -> list[PredictionHistoryItem]:
        safe_limit = max(1, min(limit, 100))
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, created_at, input_json, output_json
                FROM prediction_history
                ORDER BY id DESC
                LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()

        items: list[PredictionHistoryItem] = []
        for row in rows:
            output_payload = json.loads(row["output_json"])
            breakdown_payload = output_payload.get("breakdown", {})
            if "predictor_type" not in breakdown_payload:
                breakdown_payload["predictor_type"] = "legacy_heuristic"
            if "coefficient_terms" not in breakdown_payload:
                breakdown_payload["coefficient_terms"] = {}
            if "predicted_before_floor" not in breakdown_payload:
                breakdown_payload["predicted_before_floor"] = breakdown_payload.get(
                    "weighted_model_sum_before_clamp", 0.0
                )
            if "floor_applied_to_manual_sum" not in breakdown_payload:
                breakdown_payload["floor_applied_to_manual_sum"] = False
                output_payload["breakdown"] = breakdown_payload

            items.append(
                PredictionHistoryItem(
                    id=int(row["id"]),
                    created_at=str(row["created_at"]),
                    input=ExpensePredictionRequest.model_validate(json.loads(row["input_json"])),
                    output=self._validate_output(output_payload),
                )
            )
        return items

    @staticmethod
    def _validate_output(output_payload: dict) -> ExpensePredictionResponse:
        try:
            return ExpensePredictionResponse.model_validate(output_payload)
        except ValidationError:
            # Best-effort fallback for any older history rows if schema evolves.
            patched = dict(output_payload)
            patched.setdefault("recommendations", [])
            patched.setdefault(
                "suggested_budget_plan",
                {
                    "monthly_rent": 0.0,
                    "monthly_food": 0.0,
                    "monthly_transport": 0.0,
                    "monthly_entertainment": 0.0,
                    "expected_total_category_spend": 0.0,
                },
            )
            patched.setdefault(
                "breakdown",
                {
                    "predictor_type": "legacy_heuristic",
                    "manual_category_sum": 0.0,
                    "weighted_model_sum_before_clamp": 0.0,
                    "predicted_before_floor": 0.0,
                    "floor_applied_to_manual_sum": False,
                    "projected_minus_manual_delta": 0.0,
                    "components": {},
                    "coefficient_terms": {},
                },
            )
            return ExpensePredictionResponse.model_validate(patched)
