import { useMemo, useState } from "react";
import { compareScenarios, fetchHistory, predictExpense } from "./api";

const defaultForm = {
  monthly_income: 9000,
  monthly_rent: 2600,
  monthly_food: 700,
  monthly_transport: 350,
  monthly_entertainment: 500,
  savings_goal_monthly: 1500,
  credit_score: 740,
};

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [scenarioB, setScenarioB] = useState({
    ...defaultForm,
    monthly_rent: 2300,
    monthly_food: 620,
    monthly_entertainment: 380,
  });
  const [result, setResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fields = useMemo(() => Object.keys(defaultForm), []);
  const chartPoints = useMemo(() => {
    if (!historyItems.length) {
      return [];
    }
    const recent = [...historyItems].slice(0, 8).reverse();
    const maxExpense = Math.max(
      ...recent.map((item) => Number(item.output.predicted_monthly_expense)),
      1,
    );
    return recent.map((item) => ({
      id: item.id,
      timeLabel: new Date(item.created_at).toLocaleTimeString(),
      expense: Number(item.output.predicted_monthly_expense),
      savings: Number(item.output.projected_monthly_savings),
      expenseHeightPct: Math.max((Number(item.output.predicted_monthly_expense) / maxExpense) * 100, 8),
      risk: item.output.risk_band,
    }));
  }, [historyItems]);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const prediction = await predictExpense(form);
      setResult(prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCompare() {
    setCompareLoading(true);
    setError("");
    try {
      const comparison = await compareScenarios({
        scenario_a: form,
        scenario_b: scenarioB,
      });
      setCompareResult(comparison);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }

  async function onLoadHistory() {
    setHistoryLoading(true);
    setError("");
    try {
      const history = await fetchHistory(8);
      setHistoryItems(history.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const expenseRatio = result
    ? result.predicted_monthly_expense / Math.max(form.monthly_income, 1)
    : null;

  function ratioExplanation(ratio) {
    if (ratio < 0.55) {
      return "LOW risk means estimated spending is comfortably below your income.";
    }
    if (ratio < 0.75) {
      return "MEDIUM risk means estimated spending uses a moderate share of your income.";
    }
    return "HIGH risk means estimated spending is close to or above a high share of your income.";
  }

  function formatCurrency(value) {
    return `$${Number(value).toFixed(2)}`;
  }

  function riskClass(riskBand) {
    if (riskBand === "LOW") {
      return "risk-pill risk-low";
    }
    if (riskBand === "MEDIUM") {
      return "risk-pill risk-medium";
    }
    return "risk-pill risk-high";
  }

  return (
    <main className="container">
      <header className="hero">
        <h1>Aura Predictive Financial Engine</h1>
        <p>
          Aura helps users estimate monthly expenses, evaluate savings goals,
          compare financial scenarios, and track trend history over time.
        </p>
      </header>

      <section className="card">
        <h2>Run Prediction</h2>
        <p className="muted">
          Enter your profile in Scenario A and run the model.
        </p>
        <form onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field}>
            <span>{field.replaceAll("_", " ")}</span>
            <input
              type="number"
              value={form[field]}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, [field]: Number(event.target.value) }))
              }
              required
            />
          </label>
        ))}
        <button disabled={loading} type="submit">
          {loading ? "Predicting..." : "Run Prediction"}
        </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card result-card">
          <h2>Prediction Summary</h2>
          <div className="stats-grid">
            <div className="stat-tile">
              <span className="stat-label">Projected expense</span>
              <strong>{formatCurrency(result.predicted_monthly_expense)}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Projected savings</span>
              <strong>{formatCurrency(result.projected_monthly_savings)}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Savings goal status</span>
              <strong>{result.savings_goal_status}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Savings gap</span>
              <strong>{formatCurrency(result.savings_gap)}</strong>
            </div>
          </div>
          <div className="inline-metrics">
            <span className={riskClass(result.risk_band)}>Risk: {result.risk_band}</span>
            <span className="confidence-pill">Confidence: {result.confidence}</span>
          </div>
          <hr />
          <h3>How to read this</h3>
          <p>Expense ratio: {(expenseRatio * 100).toFixed(1)}% of monthly income.</p>
          <p>{ratioExplanation(expenseRatio)}</p>
          <p>
            Confidence is a model certainty score (0.7 to 0.95 in this prototype),
            and tends to be higher with stronger credit inputs.
          </p>
          <h3>Actionable recommendations</h3>
          <ul>
            {result.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Breakdown math panel</h3>
          <p>
            Manual category sum (rent + food + transport + entertainment):{" "}
            {formatCurrency(result.breakdown.manual_category_sum)}
          </p>
          <p>
            Weighted model sum before clamp:{" "}
            {formatCurrency(result.breakdown.weighted_model_sum_before_clamp)}
          </p>
          <p>
            Projection delta vs manual sum:{" "}
            {formatCurrency(result.breakdown.projected_minus_manual_delta)}
          </p>
          <div className="breakdown-grid">
            {Object.entries(result.breakdown.components).map(([name, value]) => (
              <p key={name}>
                <strong>{name.replaceAll("_", " ")}:</strong> {formatCurrency(value)}
              </p>
            ))}
          </div>
          <h3>Suggested budget plan</h3>
          {result.savings_goal_status === "ON_TRACK" && (
            <p className="info-note">
              No budget changes needed — you already meet your savings goal.
            </p>
          )}
          <table className="budget-table">
            <tbody>
              <tr>
                <td>Rent</td>
                <td>{formatCurrency(result.suggested_budget_plan.monthly_rent)}</td>
              </tr>
              <tr>
                <td>Food</td>
                <td>{formatCurrency(result.suggested_budget_plan.monthly_food)}</td>
              </tr>
              <tr>
                <td>Transport</td>
                <td>{formatCurrency(result.suggested_budget_plan.monthly_transport)}</td>
              </tr>
              <tr>
                <td>Entertainment</td>
                <td>{formatCurrency(result.suggested_budget_plan.monthly_entertainment)}</td>
              </tr>
              <tr>
                <td><strong>Total suggested category spend</strong></td>
                <td>
                  <strong>
                    {formatCurrency(result.suggested_budget_plan.expected_total_category_spend)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="card">
        <h2>Scenario Compare (A vs B)</h2>
        <p className="muted">
          Compare your current scenario (A) against an alternate budget plan (B)
          to choose a better savings strategy.
        </p>
        <div className="compare-grid">
          {fields.map((field) => (
            <label key={`scenario-b-${field}`}>
              <span>{`Scenario B ${field.replaceAll("_", " ")}`}</span>
              <input
                type="number"
                value={scenarioB[field]}
                onChange={(event) =>
                  setScenarioB((prev) => ({ ...prev, [field]: Number(event.target.value) }))
                }
                required
              />
            </label>
          ))}
        </div>
        <button disabled={compareLoading} onClick={onCompare} type="button">
          {compareLoading ? "Comparing..." : "Compare Scenario A vs B"}
        </button>
        {compareResult && (
          <div className="compare-results">
            <p><strong>Better scenario for goal:</strong> {compareResult.better_scenario_for_goal}</p>
            <p>
              Expense delta (B - A):{" "}
              {formatCurrency(compareResult.delta.expense_delta_b_minus_a)}
            </p>
            <p>
              Savings delta (B - A):{" "}
              {formatCurrency(compareResult.delta.savings_delta_b_minus_a)}
            </p>
            <p>
              Confidence delta (B - A): {compareResult.delta.confidence_delta_b_minus_a}
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Recent Prediction History</h2>
        <p className="muted">
          Review recent runs to track trend and discuss iterative decision-making during interviews.
        </p>
        <button disabled={historyLoading} onClick={onLoadHistory} type="button">
          {historyLoading ? "Loading history..." : "Load Recent Predictions"}
        </button>
        {chartPoints.length > 0 && (
          <div className="chart-wrapper">
            <h3>Expense Trend (last {chartPoints.length} runs)</h3>
            <div className="mini-chart">
              {chartPoints.map((point) => (
                <div key={point.id} className="bar-col">
                  <div
                    className="bar-expense"
                    style={{ height: `${point.expenseHeightPct}%` }}
                    title={`${point.timeLabel} | Expense ${formatCurrency(point.expense)} | Savings ${formatCurrency(point.savings)} | Risk ${point.risk}`}
                  />
                  <span className="bar-label">{point.timeLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {historyItems.length > 0 && (
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Savings</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>{formatCurrency(item.input.monthly_income)}</td>
                  <td>{formatCurrency(item.output.predicted_monthly_expense)}</td>
                  <td>{formatCurrency(item.output.projected_monthly_savings)}</td>
                  <td>{item.output.risk_band}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
