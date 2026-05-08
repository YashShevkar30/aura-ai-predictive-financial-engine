# Aura: AI-Powered Predictive Financial Engine

Aura is a full-stack SaaS prototype combining a Python ML API with a React dashboard to deliver real-time financial expense predictions.

## Stack
- Backend: FastAPI, NumPy, Pytest
- Frontend: React, Vite
- CI: GitHub Actions

## Architecture
- `backend/app/main.py`: API contracts and route orchestration.
- `backend/app/services/predictor.py`: deterministic predictive model logic.
- `backend/app/services/data.py`: synthetic financial dataset generation.
- `frontend/src/App.jsx`: interactive simulation UI.
- `frontend/src/api.js`: API integration layer.

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

## Documentation
- `docs/architecture.md`
- `docs/workflow.md`
