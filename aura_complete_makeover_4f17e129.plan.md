---
name: Aura Complete Makeover
overview: Complete restructuring of both backend (modular routers, config, logging, clean architecture) and frontend (component decomposition, Recharts visualizations, polished UI/UX) to make this project interview-ready for a 10-minute Intuit full-stack presentation.
todos:
  - id: backend-config
    content: Create config.py module — extract all magic values, paths, CORS origins into one place
    status: pending
  - id: backend-routers
    content: Split main.py into modular routers (prediction, history, health) under backend/app/routers/
    status: pending
  - id: backend-services
    content: "Clean up services: remove dead ModelWeights, split ml_model.py into runtime vs training, clean history_store patching"
    status: pending
  - id: backend-logging
    content: Add structured logging to backend services
    status: pending
  - id: backend-tests
    content: Enhance tests with edge cases, fixtures, and training pipeline test
    status: pending
  - id: backend-docker
    content: Fix docker-compose.yml conflicting volume mounts
    status: pending
  - id: frontend-components
    content: Decompose App.jsx into Header, PredictionForm, ResultDashboard, ScenarioCompare, HistoryPanel, ModelExplainer, BudgetPlanCard components
    status: pending
  - id: frontend-hooks
    content: "Extract API logic into custom hooks: usePrediction, useCompare, useHistory"
    status: pending
  - id: frontend-utils
    content: Create utils/formatters.js — move formatCurrency, formatCoef, signedCoef out of App
    status: pending
  - id: frontend-recharts
    content: "Install Recharts and build: expense donut chart, budget comparison bar chart, history area chart, scenario radar/bar chart"
    status: pending
  - id: frontend-ux
    content: Add tabbed navigation, loading skeletons, animated stat tiles, color-coded status indicators
    status: pending
  - id: frontend-styles
    content: Overhaul styles.css with CSS variables, refined palette, transitions, glass-morphism cards, better responsive design
    status: pending
  - id: comments-audit
    content: "Audit all files: remove verbose comments, add concise docstrings to public Python functions"
    status: pending
  - id: readme-update
    content: Update README with new architecture and demo walkthrough section
    status: pending
  - id: validate
    content: Run pytest + npm run build + lint check to confirm everything works
    status: pending
isProject: false
---

# Aura AI Financial Engine — Complete Makeover Plan

## Architecture Overview (Target State)

```mermaid
graph TB
  subgraph frontend [Frontend - React + Recharts]
    AppShell[App Shell + Navigation]
    PredForm[PredictionForm]
    ResultDash[ResultDashboard]
    ScenarioComp[ScenarioCompare]
    HistPanel[HistoryPanel]
    Charts[Recharts Visualizations]
    ResultDash --> Charts
    HistPanel --> Charts
    ScenarioComp --> Charts
  end

  subgraph backend [Backend - FastAPI Modular]
    Routers[Router Layer]
    PredRouter[prediction_router]
    HistRouter[history_router]
    HealthRouter[health_router]
    Services[Service Layer]
    Predictor[ExpensePredictor]
    MLModel[ModelManager]
    HistStore[HistoryStore]
    Config[Config Module]
    Routers --> PredRouter
    Routers --> HistRouter
    Routers --> HealthRouter
    PredRouter --> Predictor
    Predictor --> MLModel
    PredRouter --> HistStore
    HistRouter --> HistStore
  end

  frontend -->|"HTTP /predict, /compare, /history"| backend
```

---

## Phase 1: Backend Restructuring

### 1A. Add Config Module — new file `backend/app/config.py`
- Extract all magic values (CORS origins, model path, DB path, dataset path) into a single config class
- Use `pydantic-settings` or plain constants — removes the hardcoded `/Users/spartan/Downloads/...` path
- Environment-variable driven for portability

### 1B. Modular Router Layer — split [backend/app/main.py](backend/app/main.py)
- Create `backend/app/routers/` directory with:
  - `prediction.py` — `/predict` and `/compare` endpoints
  - `history.py` — `/history` endpoint
  - `health.py` — `/health` and `/dataset/sample` endpoints
- `main.py` becomes a thin app factory: creates FastAPI, adds middleware, includes routers
- Follows **Single Responsibility Principle** and FastAPI best practices

### 1C. Clean Up Service Layer
- **[backend/app/services/predictor.py](backend/app/services/predictor.py):** Remove dead `ModelWeights` dataclass (unused since ML model). Tighten the class to prediction + recommendations only.
- **[backend/app/services/ml_model.py](backend/app/services/ml_model.py):** Split into two concerns:
  - `ml_model.py` — model loading, inference, contribution extraction (runtime)
  - `training.py` — dataset parsing, augmentation, training pipeline (offline only)
  - This follows **SRP** — runtime code doesn't carry training dependencies
- **[backend/app/services/history_store.py](backend/app/services/history_store.py):** Clean up the legacy schema patching into a dedicated migration/compat helper, reduce nesting

### 1D. Add Structured Logging
- Add Python `logging` with a configured format in config
- Log prediction requests, model load events, and errors — invaluable for the demo

### 1E. Enhance Tests — [backend/tests/test_api.py](backend/tests/test_api.py)
- Add edge-case tests (zero income, max credit score, boundary values)
- Add a test for the training pipeline
- Add a test that validates schema contract evolution
- Use `pytest` fixtures for test client to follow DRY

### 1F. Fix Docker Compose — [docker-compose.yml](docker-compose.yml)
- Fix conflicting volume mounts (`./backend:/app` vs `aura_history_data:/app` both target `/app`)
- Mount DB volume to a specific subdirectory

---

## Phase 2: Frontend Component Decomposition

### 2A. Break up [frontend/src/App.jsx](frontend/src/App.jsx) (564 lines) into modular components

Target structure:
```
frontend/src/
  components/
    Header.jsx              — hero banner + badges
    PredictionForm.jsx      — form inputs, presets, submit
    ResultDashboard.jsx     — stat tiles, risk meter, recommendations
    ExpenseBreakdownChart.jsx — Recharts donut + bar for expense breakdown
    BudgetPlanCard.jsx      — suggested budget as visual comparison
    ScenarioCompare.jsx     — side-by-side scenario form + visual delta
    HistoryPanel.jsx        — history table + trend line chart
    ModelExplainer.jsx      — formula panel + coefficient interpretation
  hooks/
    usePrediction.js        — prediction API call + state
    useCompare.js           — compare API call + state
    useHistory.js           — history API call + state
  utils/
    formatters.js           — formatCurrency, formatCoef, signedCoef (DRY)
  App.jsx                   — thin shell composing components
  api.js                    — kept as-is (already clean)
  main.jsx                  — kept as-is
```

Each component is a focused, testable unit. Custom hooks extract async logic from components (Separation of Concerns).

### 2B. Install Recharts for Professional Visualizations
- Add `recharts` dependency — lightweight, React-native, great for financial data
- **No other heavy dependencies** — keeps bundle small for interview demo

---

## Phase 3: UI/UX Overhaul + Visualizations

### 3A. New Visualizations (the biggest visual impact)

| Location | Current | Target |
|---|---|---|
| Expense Breakdown | Plain text list | **Recharts PieChart** (donut) showing rent/food/transport/entertainment proportions |
| Budget Plan | HTML table | **Recharts BarChart** — grouped bars: current spend vs suggested spend per category |
| Scenario Compare | 3 text paragraphs | **Side-by-side RadarChart** or grouped bar chart with visual delta indicators |
| History Trend | CSS div bars with tooltip | **Recharts AreaChart** — smooth expense trend line with savings area overlay |
| Risk Meter | CSS progress bar | **Animated gauge** with gradient segments (LOW/MED/HIGH zones marked) |

### 3B. UI Polish
- **Tabbed navigation** — instead of a long scroll, use tabs: "Predict" | "Compare" | "History" — better for a 10-min demo flow
- **Animated number transitions** on stat tiles when results arrive
- **Loading skeletons** instead of bare "Predicting..." text
- **Color-coded stat tiles** — green for savings on track, red/amber for behind goal
- **Glass-morphism cards** with subtle backdrop-filter for modern SaaS feel
- **Micro-interactions** — button hover effects, card entrance animations via CSS transitions
- **Better typography hierarchy** — larger stat numbers, smaller labels, consistent spacing

### 3C. Restyle [frontend/src/styles.css](frontend/src/styles.css)
- CSS custom properties (variables) for theming consistency
- Refined color palette with semantic tokens (success, warning, danger, info)
- Smoother transitions and hover states
- Better responsive breakpoints

---

## Phase 4: Final Polish

### 4A. Clean Comments Audit (all files)
- Remove any verbose/narrating comments
- Add brief docstrings to public Python functions explaining *why*, not *what*
- Frontend: zero comments in JSX (self-documenting component names)

### 4B. Update README
- Update architecture section to reflect new modular structure
- Add a "Demo Walkthrough" section for the 10-min presentation flow

### 4C. Validate
- Run `pytest` to confirm all tests pass
- Run `npm run build` to confirm frontend builds cleanly
- Check for linter errors in all edited files

---

## Design Principles Applied

- **SOLID**: Single Responsibility (routers, services, components), Open/Closed (config-driven behavior), Dependency Inversion (predictor depends on abstract model interface)
- **DRY**: Shared formatters, custom hooks, config module, pytest fixtures
- **Separation of Concerns**: API routing vs business logic vs ML inference vs data persistence
- **Component Composition**: Small, focused React components over monolithic files
