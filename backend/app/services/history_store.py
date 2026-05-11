import json
import sqlite3
from pathlib import Path

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
            items.append(
                PredictionHistoryItem(
                    id=int(row["id"]),
                    created_at=str(row["created_at"]),
                    input=ExpensePredictionRequest.model_validate(json.loads(row["input_json"])),
                    output=ExpensePredictionResponse.model_validate(json.loads(row["output_json"])),
                )
            )
        return items
