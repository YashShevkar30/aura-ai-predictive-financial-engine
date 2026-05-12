import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { formatCurrency, riskClass } from "../utils/formatters";

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];
const FACTOR_COLORS = { positive: "#ef4444", negative: "#22c55e", neutral: "#64748b" };

export default function ResultDashboard({ result, form }) {
  const income = form.monthly_income;
  const expenseRatio = result.predicted_monthly_expense / Math.max(income, 1);
  const riskDeg = Math.min(Math.max(expenseRatio * 180, 0), 180);

  const pieData = [
    { name: "Rent", value: form.monthly_rent },
    { name: "Food", value: form.monthly_food },
    { name: "Transport", value: form.monthly_transport },
    { name: "Entertainment", value: form.monthly_entertainment },
  ].filter((item) => item.value > 0);

  const delta = result.breakdown.projected_minus_manual_delta;
  const savingsPercent = ((result.projected_monthly_savings / Math.max(income, 1)) * 100).toFixed(1);

  const factors = Object.entries(result.breakdown.coefficient_terms || {})
    .filter(([key]) => key !== "bias")
    .map(([key, coef]) => {
      const raw = result.breakdown.components[`${key}_term`] ?? result.breakdown.components[`${key}_adjustment_term`] ?? 0;
      return {
        name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: Math.abs(raw),
        raw,
        direction: raw > 10 ? "Increases" : raw < -10 ? "Reduces" : "Minimal",
        fill: raw > 10 ? FACTOR_COLORS.positive : raw < -10 ? FACTOR_COLORS.negative : FACTOR_COLORS.neutral,
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dashboard-section">
      <h2>Prediction Summary</h2>

      <div className="insight-banner">
        {delta >= 0 ? (
          <p>
            📊 Aura predicts you'll spend about <strong>{formatCurrency(Math.abs(delta))} more</strong> than
            your entered categories suggest — this accounts for hidden costs like subscriptions, impulse spending,
            and seasonal variation the model learned from training data.
          </p>
        ) : (
          <p>
            📊 Aura predicts you'll spend about <strong>{formatCurrency(Math.abs(delta))} less</strong> than
            your entered categories suggest — your profile shows disciplined spending patterns that the model
            recognizes from historical trends.
          </p>
        )}
      </div>

      <div className="stats-grid">
        <div className={`stat-tile ${result.savings_goal_status === "ON_TRACK" ? "border-success" : "border-warning"}`}>
          <span className="stat-label">Projected Expense</span>
          <strong>{formatCurrency(result.predicted_monthly_expense)}</strong>
          <span className="stat-sub">{(expenseRatio * 100).toFixed(0)}% of income</span>
        </div>
        <div className={`stat-tile ${result.savings_goal_status === "ON_TRACK" ? "border-success" : "border-warning"}`}>
          <span className="stat-label">Projected Savings</span>
          <strong>{formatCurrency(result.projected_monthly_savings)}</strong>
          <span className="stat-sub">{savingsPercent}% of income</span>
        </div>
        <div className={`stat-tile ${result.savings_goal_status === "ON_TRACK" ? "border-success" : "border-warning"}`}>
          <span className="stat-label">Goal Status</span>
          <strong className={result.savings_goal_status === "ON_TRACK" ? "text-success" : "text-warning"}>
            {result.savings_goal_status === "ON_TRACK" ? "✅ On Track" : "⚠️ Behind Goal"}
          </strong>
          <span className="stat-sub">Target: {formatCurrency(form.savings_goal_monthly)}/mo</span>
        </div>
        <div className={`stat-tile ${result.savings_gap === 0 ? "border-success" : "border-warning"}`}>
          <span className="stat-label">Savings Gap</span>
          <strong>{formatCurrency(result.savings_gap)}</strong>
          <span className="stat-sub">{result.savings_gap === 0 ? "No shortfall" : "Need to cut"}</span>
        </div>
      </div>

      <div className="inline-metrics">
        <span className={riskClass(result.risk_band)}>Risk: {result.risk_band}</span>
        <span className="confidence-pill">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
      </div>

      <div className="viz-grid">
        <div className="viz-card">
          <h3>Where Your Money Goes</h3>
          <p className="viz-subtitle">Your entered monthly category spending</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="viz-card">
          <h3>Financial Health</h3>
          <p className="viz-subtitle">Expense-to-income ratio</p>
          <div className="gauge-container">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#riskGradient)" strokeWidth="20" strokeLinecap="round" />
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="55%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <line
                x1="100" y1="100" x2="30" y2="100"
                stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round"
                className="gauge-needle"
                style={{ transform: `rotate(${riskDeg}deg)`, transformOrigin: "100px 100px" }}
              />
              <circle cx="100" cy="100" r="6" fill="#e2e8f0" />
            </svg>
            <div className="gauge-label">
              <strong>{(expenseRatio * 100).toFixed(1)}%</strong>
              <span>{result.risk_band === "LOW" ? "Healthy" : result.risk_band === "MEDIUM" ? "Moderate" : "High Risk"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="viz-card factor-card">
        <h3>What Drives Your Prediction</h3>
        <p className="viz-subtitle">
          Each factor either pushes your predicted expense up (red) or pulls it down (green).
          Bigger bars = stronger influence on the model's output.
        </p>
        <div className="factor-list">
          {factors.map((f) => (
            <div key={f.name} className="factor-row">
              <span className="factor-name">{f.name}</span>
              <div className="factor-bar-container">
                <div
                  className="factor-bar"
                  style={{
                    width: `${Math.min((f.value / Math.max(...factors.map((x) => x.value), 1)) * 100, 100)}%`,
                    backgroundColor: f.fill,
                  }}
                />
              </div>
              <span className={`factor-tag ${f.raw > 10 ? "tag-up" : f.raw < -10 ? "tag-down" : "tag-neutral"}`}>
                {f.direction}
              </span>
            </div>
          ))}
        </div>
      </div>

      <details open className="detail-block">
        <summary>Actionable Recommendations</summary>
        <ul className="recommendation-list">
          {result.recommendations.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
