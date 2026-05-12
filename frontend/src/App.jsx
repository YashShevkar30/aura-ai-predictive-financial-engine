import { useState } from "react";
import Header from "./components/Header";
import PredictionForm from "./components/PredictionForm";
import HowAuraDecides from "./components/HowAuraDecides";
import ResultDashboard from "./components/ResultDashboard";
import BreakdownPanel from "./components/BreakdownPanel";
import BudgetPlanCard from "./components/BudgetPlanCard";
import ModelExplainer from "./components/ModelExplainer";
import ScenarioCompare from "./components/ScenarioCompare";
import HistoryPanel from "./components/HistoryPanel";
import { usePrediction } from "./hooks/usePrediction";

const defaultForm = {
  monthly_income: 9000,
  monthly_rent: 2600,
  monthly_food: 700,
  monthly_transport: 350,
  monthly_entertainment: 500,
  savings_goal_monthly: 1500,
  credit_score: 740,
};

function Skeleton() {
  return (
    <div className="skeleton-wrapper card result-card">
      <div className="skeleton title"></div>
      <div className="stats-grid">
        <div className="skeleton tile"></div>
        <div className="skeleton tile"></div>
        <div className="skeleton tile"></div>
        <div className="skeleton tile"></div>
      </div>
      <div className="skeleton box"></div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState("predict");
  const { result, loading, error, predict, clearError } = usePrediction();

  return (
    <main className="container">
      <Header />
      
      <div className="tab-bar">
        <button 
          className={`tab-button ${activeTab === "predict" ? "active" : ""}`}
          onClick={() => { setActiveTab("predict"); clearError(); }}
        >
          Predict
        </button>
        <button 
          className={`tab-button ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => { setActiveTab("compare"); clearError(); }}
        >
          Compare
        </button>
        <button 
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => { setActiveTab("history"); clearError(); }}
        >
          History
        </button>
      </div>

      {activeTab === "predict" && (
        <>
          <section className="layout-grid">
            <PredictionForm form={form} setForm={setForm}
              onSubmit={() => predict(form)} loading={loading} />
            <HowAuraDecides />
          </section>

          {error && <p className="error">{error}</p>}
          
          {loading && <Skeleton />}

          {!loading && result && (
            <section className="card result-card">
              <ResultDashboard result={result} form={form} />
              <BreakdownPanel breakdown={result.breakdown} />
              <BudgetPlanCard budgetPlan={result.suggested_budget_plan}
                savingsGoalStatus={result.savings_goal_status} form={form} />
              <ModelExplainer coefficientTerms={result.breakdown.coefficient_terms} />
            </section>
          )}
        </>
      )}

      {activeTab === "compare" && (
        <ScenarioCompare baseScenario={form} />
      )}

      {activeTab === "history" && (
        <HistoryPanel />
      )}
    </main>
  );
}
