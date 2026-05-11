# Aura Architecture

## Objectives
- Enable instant financial what-if simulations.
- Serve reliable prediction APIs for frontend clients.
- Keep model logic transparent and testable.

## Components
- **Prediction API**: Handles health checks, predictions, and sample data endpoints.
- **Prediction Service**: Lightweight feature engineering + scoring model.
- **Scenario Compare API**: Evaluates A/B financial plans and returns decision deltas.
- **History Store**: Persists prediction runs in SQLite for trend review.
- **React UI**: Captures user inputs and renders projected outcome/risk.
- **Decision Support UI**: Shows breakdown math, suggested budget plan, and scenario comparison output.
- **CI pipeline**: Validates backend tests and frontend build integrity.

## Data Flow
1. User submits financial profile from frontend.
2. Frontend sends payload to `/predict`.
3. Backend computes projected expense, confidence, and risk band.
4. Backend saves run to history storage.
5. UI renders result, suggested budget, and supports iterative scenario testing.
6. Optional compare call (`/compare`) evaluates alternate scenario tradeoffs.
