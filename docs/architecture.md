# Aura Architecture

## Objectives
- Enable instant financial what-if simulations.
- Serve reliable prediction APIs for frontend clients.
- Keep model logic transparent and testable.

## Components
- **Prediction API**: Handles health checks, predictions, and sample data endpoints.
- **Prediction Service**: Lightweight feature engineering + scoring model.
- **React UI**: Captures user inputs and renders projected outcome/risk.
- **CI pipeline**: Validates backend tests and frontend build integrity.

## Data Flow
1. User submits financial profile from frontend.
2. Frontend sends payload to `/predict`.
3. Backend computes projected expense, confidence, and risk band.
4. UI renders result and supports iterative scenario testing.
