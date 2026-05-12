import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency } from "../utils/formatters";

export default function BreakdownPanel({ breakdown }) {
  const components = breakdown.components || {};
  const chartData = Object.entries(components)
    .filter(([key]) => key !== "bias")
    .map(([key, value]) => ({
      name: key.replace(/_term$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: Number(value),
      fill: Number(value) >= 0 ? "#ef4444" : "#22c55e",
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <details className="detail-block">
      <summary>How the Prediction Was Built</summary>

      <div className="breakdown-explainer">
        <div className="breakdown-step">
          <span className="step-icon">1️⃣</span>
          <div>
            <strong>Your entered spending</strong>
            <p>Rent + Food + Transport + Entertainment = {formatCurrency(breakdown.manual_category_sum)}</p>
          </div>
        </div>
        <div className="breakdown-step">
          <span className="step-icon">2️⃣</span>
          <div>
            <strong>ML model adjustment</strong>
            <p>
              The model analyzes your income, credit score, and spending ratios to predict
              {breakdown.projected_minus_manual_delta >= 0 ? " additional " : " reduced "}
              spending of {formatCurrency(Math.abs(breakdown.projected_minus_manual_delta))}
            </p>
          </div>
        </div>
        <div className="breakdown-step">
          <span className="step-icon">3️⃣</span>
          <div>
            <strong>Final prediction</strong>
            <p>
              {breakdown.floor_applied_to_manual_sum
                ? `Model predicted ${formatCurrency(breakdown.predicted_before_floor)}, but your actual category spending of ${formatCurrency(breakdown.manual_category_sum)} was used as a floor for realism.`
                : `Model output of ${formatCurrency(breakdown.weighted_model_sum_before_clamp)} was used directly.`}
            </p>
          </div>
        </div>
      </div>

      <h4 className="chart-section-title">Contribution of Each Factor</h4>
      <p className="viz-subtitle">
        Red bars increase your predicted expense. Green bars reduce it.
        The bias is the model's baseline before any of your inputs are applied.
      </p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={95} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
            />
            <ReferenceLine x={0} stroke="#475569" />
            <Bar dataKey="value" name="Impact" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bias-note">
        <strong>Model baseline (bias):</strong> {formatCurrency(components.bias || 0)} — this is the starting
        point before your specific financial inputs shift the prediction up or down.
      </div>
    </details>
  );
}
