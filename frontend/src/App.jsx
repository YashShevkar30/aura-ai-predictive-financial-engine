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
  const fieldLabels = useMemo(
    () => ({
      monthly_income: "Monthly Income",
      monthly_rent: "Monthly Rent",
      monthly_food: "Monthly Food",
      monthly_transport: "Monthly Transport",
      monthly_entertainment: "Monthly Entertainment",
      savings_goal_monthly: "Savings Goal (Monthly)",
      credit_score: "Credit Score",
    }),
    [],
  );
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

  function formatCoef(value) {
    return Number(value ?? 0).toFixed(4);
  }

  function signedCoef(value) {
    const numeric = Number(value ?? 0);
    return `${numeric >= 0 ? "+" : "-"} ${Math.abs(numeric).toFixed(4)}`;
  }

  function projectionDeltaMessage(deltaValue) {
    const delta = Number(deltaValue ?? 0);
    const absDelta = formatCurrency(Math.abs(delta));
    if (delta >= 0) {
      return `You may spend about ${absDelta} above your entered category budget in the upcoming month.`;
    }
    return `You may spend about ${absDelta} below your entered category budget in the upcoming month.`;
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

  function applyPreset(preset) {
    setForm((prev) => ({ ...prev, ...preset }));
  }

  return (
    <main className="container">
      <header className="hero">
        <h1>Aura Predictive Financial Engine</h1>
        <p>
          A modern financial decision dashboard to forecast expenses, evaluate
          savings goals, compare scenarios, and explain model outputs with
          transparent math.
        </p>
        <div className="hero-badges">
          <span>Predictive ML</span>
          <span>Scenario Compare</span>
          <span>Goal Optimization</span>
          <span>Trend Tracking</span>
        </div>
      </header>

      <section className="layout-grid">
        <div className="card">
          <h2>Scenario A · Run Prediction</h2>
          <p className="muted">
            Enter your profile and generate expense forecast with decision
            guidance.
          </p>

          <div className="preset-row">
            <button
              className="preset-button"
              onClick={() =>
                applyPreset({
                  monthly_income: 4500,
                  monthly_rent: 1500,
                  monthly_food: 480,
                  monthly_transport: 220,
                  monthly_entertainment: 260,
                  savings_goal_monthly: 900,
                  credit_score: 680,
                })
              }
              type="button"
            >
              Starter Profile
            </button>
            <button
              className="preset-button"
              onClick={() =>
                applyPreset({
                  monthly_income: 7000,
                  monthly_rent: 2200,
                  monthly_food: 650,
                  monthly_transport: 320,
                  monthly_entertainment: 430,
                  savings_goal_monthly: 1500,
                  credit_score: 730,
                })
              }
              type="button"
            >
              Balanced Profile
            </button>
            <button
              className="preset-button"
              onClick={() =>
                applyPreset({
                  monthly_income: 10000,
                  monthly_rent: 2900,
                  monthly_food: 820,
                  monthly_transport: 500,
                  monthly_entertainment: 650,
                  savings_goal_monthly: 2600,
                  credit_score: 780,
                })
              }
              type="button"
            >
              Growth Profile
            </button>
          </div>

          <form onSubmit={onSubmit}>
            {fields.map((field) => (
              <label key={field}>
                <span>{fieldLabels[field]}</span>
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
        </div>

        <div className="card quick-help">
          <h2>How Aura Decides</h2>
          <p className="muted">
            Aura predicts expense, then applies goal and risk decision logic for
            realistic recommendations.
          </p>
          <div className="formula-panel">
            <p className="formula-title">Core Prediction Equation</p>
            <p className="formula">
              Ê = β₀ + β₁·Income + β₂·Rent + β₃·Food + β₄·Transport + β₅·Entertainment + β₆·CreditScore
            </p>
          </div>
          <div className="formula-panel">
            <p className="formula-title">Realism Constraint</p>
            <p className="formula">
              E<sub>final</sub> = max(E<sub>predicted</sub>, E<sub>manual-category-sum</sub>)
            </p>
          </div>
          <div className="formula-panel">
            <p className="formula-title">Risk Ratio</p>
            <p className="formula">
              R = E<sub>final</sub> / MonthlyIncome
            </p>
          </div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card result-card">
          <h2>Prediction Summary</h2>
          <p className="muted">
            Based on your current financial profile and learned historical patterns,
            the model estimates your upcoming-month expense is likely to be
            higher/lower than your entered category baseline.
          </p>
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
          <div className="risk-meter-wrap">
            <div className="risk-meter-label">
              <span>Expense Ratio</span>
              <strong>{(expenseRatio * 100).toFixed(1)}%</strong>
            </div>
            <div className="risk-meter">
              <div
                className="risk-meter-fill"
                style={{ width: `${Math.min(expenseRatio * 100, 100)}%` }}
              />
            </div>
          </div>
          <hr />
          <details open className="detail-block">
            <summary>How to read this output</summary>
            <p>{ratioExplanation(expenseRatio)}</p>
            <p>
              Confidence is a model certainty score (0.7 to 0.95 in this
              prototype), and tends to be higher with stronger credit inputs.
            </p>
          </details>

          <details open className="detail-block">
            <summary>Actionable recommendations</summary>
            <ul>
              {result.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>

          <details className="detail-block">
            <summary>Breakdown math panel</summary>
            {result.breakdown.floor_applied_to_manual_sum && (
              <p className="info-note">
                Model output was below your declared category total, so projection
                was adjusted up to manual spend for realism.
              </p>
            )}
            <div className="formula-panel">
              <p className="formula">
                E<sub>final</sub> = max(E<sub>predicted</sub>, E<sub>manual</sub>)
              </p>
            </div>
            <p>
              Manual category sum:{" "}
              {formatCurrency(result.breakdown.manual_category_sum)}
            </p>
            <p>
              Model sum before clamp:{" "}
              {formatCurrency(result.breakdown.weighted_model_sum_before_clamp)}
            </p>
            <p>
              Predicted before floor:{" "}
              {formatCurrency(result.breakdown.predicted_before_floor)}
            </p>
            <p>
              Delta vs manual sum:{" "}
              {formatCurrency(result.breakdown.projected_minus_manual_delta)}
            </p>
            <p className="info-note">
              {projectionDeltaMessage(result.breakdown.projected_minus_manual_delta)}
            </p>
            <div className="breakdown-grid">
              {Object.entries(result.breakdown.components).map(([name, value]) => (
                <p key={name}>
                  <strong>{name.replaceAll("_", " ")}:</strong>{" "}
                  {formatCurrency(value)}
                </p>
              ))}
            </div>
          </details>

          <details open className="detail-block">
            <summary>Suggested budget plan</summary>
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
                      {formatCurrency(
                        result.suggested_budget_plan.expected_total_category_spend,
                      )}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </details>

          <details className="detail-block">
            <summary>Model coefficient interpretation</summary>
            <div className="coef-card">
              <p className="formula">
                Ê = {formatCoef(result.breakdown.coefficient_terms.bias)}
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.income)}·Income
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.rent)}·Rent
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.food)}·Food
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.transport)}·Transport
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.entertainment)}·Entertainment
                {" "}
                {signedCoef(result.breakdown.coefficient_terms.credit_score)}·CreditScore
              </p>
              <ul>
                <li>
                  <strong>Income ({formatCoef(result.breakdown.coefficient_terms.income)}):</strong>{" "}
                  higher income changes projected spend by this learned weight.
                </li>
                <li>
                  <strong>Category terms:</strong> rent/food/transport/entertainment
                  represent contribution direction and magnitude in the fitted model.
                </li>
                <li>
                  <strong>Credit score ({formatCoef(result.breakdown.coefficient_terms.credit_score)}):</strong>{" "}
                  stronger credit can reduce projected expense if coefficient is negative.
                </li>
                <li>
                  <strong>Bias ({formatCoef(result.breakdown.coefficient_terms.bias)}):</strong>{" "}
                  baseline model offset before feature terms.
                </li>
              </ul>
              <div className="model-meta-strip">
                <strong>Model used:</strong> Linear Regression / Ridge baseline
              </div>
            </div>
          </details>
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
