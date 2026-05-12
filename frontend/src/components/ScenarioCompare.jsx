import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/formatters";
import { useCompare } from "../hooks/useCompare";

export default function ScenarioCompare({ baseScenario }) {
  const { compareResult, compareLoading, error, compare } = useCompare();

  const fields = useMemo(
    () => [
      "monthly_income", "monthly_rent", "monthly_food", "monthly_transport",
      "monthly_entertainment", "savings_goal_monthly", "credit_score",
    ],
    []
  );

  const fieldLabels = {
    monthly_income: "Income", monthly_rent: "Rent", monthly_food: "Food",
    monthly_transport: "Transport", monthly_entertainment: "Entertainment",
    savings_goal_monthly: "Savings Goal", credit_score: "Credit Score",
  };

  const [scenarioB, setScenarioB] = useState({
    ...baseScenario,
    monthly_rent: Math.max(baseScenario.monthly_rent - 300, 0),
    monthly_food: Math.max(baseScenario.monthly_food - 80, 0),
    monthly_entertainment: Math.max(baseScenario.monthly_entertainment - 120, 0),
  });

  const chartData = compareResult ? [
    {
      metric: "Expense",
      A: compareResult.scenario_a_result.predicted_monthly_expense,
      B: compareResult.scenario_b_result.predicted_monthly_expense,
    },
    {
      metric: "Savings",
      A: compareResult.scenario_a_result.projected_monthly_savings,
      B: compareResult.scenario_b_result.projected_monthly_savings,
    },
    {
      metric: "Gap",
      A: compareResult.scenario_a_result.savings_gap,
      B: compareResult.scenario_b_result.savings_gap,
    },
  ] : [];

  const rA = compareResult?.scenario_a_result;
  const rB = compareResult?.scenario_b_result;

  return (
    <div className="card">
      <h2>Scenario Compare (A vs B)</h2>
      <p className="muted">
        Adjust Scenario B below and compare it against your current inputs (Scenario A)
        to find the better savings strategy.
      </p>

      <div className="compare-grid">
        {fields.map((field) => (
          <label key={`scenario-b-${field}`}>
            <span>B: {fieldLabels[field]}</span>
            <input
              type="number"
              value={scenarioB[field]}
              onChange={(e) => setScenarioB((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
              required
            />
          </label>
        ))}
      </div>
      <button disabled={compareLoading} onClick={() => compare({ scenario_a: baseScenario, scenario_b: scenarioB })} type="button">
        {compareLoading ? "Comparing..." : "Compare Scenario A vs B"}
      </button>

      {error && <p className="error">{error}</p>}

      {compareResult && (
        <div className="compare-results">
          <div className="compare-verdict">
            <span className="verdict-label">Better scenario for your goal:</span>
            <span className="verdict-value">{compareResult.better_scenario_for_goal === "A" ? "🅰️ Scenario A" : "🅱️ Scenario B"}</span>
          </div>

          <div style={{ width: "100%", height: 280, marginTop: "1.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Legend />
                <Bar dataKey="A" name="Scenario A" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" name="Scenario B" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="compare-table-title">Full Side-by-Side Breakdown</h3>
          <div className="table-responsive">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Scenario A</th>
                  <th>Scenario B</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Predicted Expense</td>
                  <td>{formatCurrency(rA.predicted_monthly_expense)}</td>
                  <td>{formatCurrency(rB.predicted_monthly_expense)}</td>
                  <td className={compareResult.delta.expense_delta_b_minus_a > 0 ? "text-danger" : "text-success"}>
                    {compareResult.delta.expense_delta_b_minus_a > 0 ? "+" : ""}
                    {formatCurrency(compareResult.delta.expense_delta_b_minus_a)}
                  </td>
                </tr>
                <tr>
                  <td>Projected Savings</td>
                  <td>{formatCurrency(rA.projected_monthly_savings)}</td>
                  <td>{formatCurrency(rB.projected_monthly_savings)}</td>
                  <td className={compareResult.delta.savings_delta_b_minus_a > 0 ? "text-success" : "text-danger"}>
                    {compareResult.delta.savings_delta_b_minus_a > 0 ? "+" : ""}
                    {formatCurrency(compareResult.delta.savings_delta_b_minus_a)}
                  </td>
                </tr>
                <tr>
                  <td>Risk Band</td>
                  <td><span className={`risk-pill-small ${rA.risk_band === "LOW" ? "risk-low" : rA.risk_band === "MEDIUM" ? "risk-medium" : "risk-high"}`}>{rA.risk_band}</span></td>
                  <td><span className={`risk-pill-small ${rB.risk_band === "LOW" ? "risk-low" : rB.risk_band === "MEDIUM" ? "risk-medium" : "risk-high"}`}>{rB.risk_band}</span></td>
                  <td>{rA.risk_band === rB.risk_band ? "Same" : rB.risk_band === "LOW" ? "✅ Improved" : "⚠️ Worse"}</td>
                </tr>
                <tr>
                  <td>Goal Status</td>
                  <td className={rA.savings_goal_status === "ON_TRACK" ? "text-success" : "text-warning"}>{rA.savings_goal_status === "ON_TRACK" ? "✅ On Track" : "⚠️ Behind"}</td>
                  <td className={rB.savings_goal_status === "ON_TRACK" ? "text-success" : "text-warning"}>{rB.savings_goal_status === "ON_TRACK" ? "✅ On Track" : "⚠️ Behind"}</td>
                  <td>{rA.savings_goal_status === rB.savings_goal_status ? "Same" : rB.savings_goal_status === "ON_TRACK" ? "✅ Improved" : "⚠️ Worse"}</td>
                </tr>
                <tr>
                  <td>Savings Gap</td>
                  <td>{formatCurrency(rA.savings_gap)}</td>
                  <td>{formatCurrency(rB.savings_gap)}</td>
                  <td className={rB.savings_gap < rA.savings_gap ? "text-success" : rB.savings_gap > rA.savings_gap ? "text-danger" : ""}>
                    {formatCurrency(rB.savings_gap - rA.savings_gap)}
                  </td>
                </tr>
                <tr>
                  <td>Confidence</td>
                  <td>{(rA.confidence * 100).toFixed(0)}%</td>
                  <td>{(rB.confidence * 100).toFixed(0)}%</td>
                  <td>{(compareResult.delta.confidence_delta_b_minus_a * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="compare-insight">
            {compareResult.better_scenario_for_goal === "B" ? (
              <p>💡 <strong>Scenario B saves you {formatCurrency(Math.abs(compareResult.delta.savings_delta_b_minus_a))} more</strong> per month. The spending reductions in B result in a tighter budget but bring you closer to your savings goal.</p>
            ) : (
              <p>💡 <strong>Scenario A is currently better</strong> for your savings goal. Scenario B's changes don't improve the gap — consider adjusting different categories in B.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
