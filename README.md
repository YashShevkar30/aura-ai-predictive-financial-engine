# Aura: AI-Powered Predictive Financial Engine

Aura is a full-stack SaaS prototype combining a Python ML API with a React dashboard to deliver real-time financial expense predictions.

## Stack
- Backend: FastAPI, NumPy, scikit-learn, joblib, SQLite, Pytest
- Frontend: React, Vite
- CI: GitHub Actions
- Containers: Docker, Docker Compose

## Architecture

Aura follows a modular, decoupled architecture to ensure testability, readability, and scalability.

### Backend (FastAPI)
- **`app/main.py`**: Thin application factory and router composition.
- **`app/config.py`**: Centralized configuration and environment variables.
- **`app/routers/`**: Modular endpoints (`prediction.py`, `compare.py`, `history.py`, `health.py`).
- **`app/services/`**: Core business logic.
  - `ml_model.py`: Ridge regression feature transformation and projection logic.
  - `training.py`: Synthetic dataset generation and model fitting.
  - `predictor.py`: Financial rules engine (risk bands, recommendations, budget plans).
  - `history_store.py`: SQLite persistence layer.
- **`app/schemas.py`**: Pydantic models for strict I/O validation.

### Frontend (React + Vite)
- **`src/App.jsx`**: Main layout shell and tabbed navigation.
- **`src/components/`**: Focused UI pieces (`PredictionForm`, `ResultDashboard`, `ScenarioCompare`, `HistoryPanel`, etc.).
- **`src/hooks/`**: Data fetching and API state management (`usePrediction`, `useCompare`, `useHistory`).
- **`src/utils/`**: Shared logic like currency formatting and risk evaluation.
- **`src/styles.css`**: CSS variables, dark-mode glassmorphism, and responsive design.

---

## Demo Walkthrough (10-min Intuit Presentation)
1. Open app → show Predict tab with Starter Profile preset.
2. Run prediction → walk through stat tiles, donut chart, risk gauge.
3. Show actionable recommendations and budget plan comparison bar chart.
4. Switch to Compare tab → run A vs B scenario and explain delta metrics.
5. Switch to History tab → show trend area chart across previous runs.
6. Open backend `/docs` → show FastAPI auto-generated Swagger UI.
7. Show modular code structure (routers, services, hooks, components) in IDE.

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

## ML Training Data
- Primary source: `Expenses Data Set.csv` (Kaggle-style transaction dataset) if available at `/Users/spartan/Downloads/Expenses Data Set.csv`.
- If dataset is unavailable, the app falls back to synthetic training data.
- Model training/evaluation metadata is stored with the model artifact (`mae`, `rmse`, train/test rows).

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
