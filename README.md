# Aura: AI-Powered Predictive Financial Engine

Aura is a full-stack SaaS prototype combining a Python ML API with a React dashboard to deliver real-time financial expense predictions.

## Stack
- Backend: FastAPI, NumPy, SQLite, Pytest
- Frontend: React, Vite
- CI: GitHub Actions
- Containers: Docker, Docker Compose

## Architecture
- `backend/app/main.py`: API contracts, prediction orchestration, compare flow, history API.
- `backend/app/services/predictor.py`: deterministic predictive model logic + actionable budget plan.
- `backend/app/services/history_store.py`: SQLite persistence for prediction history.
- `backend/app/services/data.py`: synthetic financial dataset generation.
- `frontend/src/App.jsx`: prediction UI, breakdown math panel, scenario compare, history table.
- `frontend/src/api.js`: prediction, compare, and history API integration layer.

## Run Locally

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing
```bash
PYTHONPATH=backend pytest backend/tests -q
```

## API Endpoints
- `POST /predict` - run a prediction, return risk + savings + recommendations + breakdown.
- `POST /compare` - compare Scenario A vs Scenario B and return deltas.
- `GET /history?limit=8` - fetch recent persisted prediction runs.
- `GET /health` - service health.
- `GET /dataset/sample?size=15` - synthetic demo dataset.

## Run With Docker
```bash
docker compose up --build
```

Then open:
- Frontend: `http://127.0.0.1:5173`
- Backend docs: `http://127.0.0.1:8000/docs`

## Documentation
- `docs/architecture.md`
- `docs/workflow.md`
