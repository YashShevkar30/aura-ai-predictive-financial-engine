import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "../utils/formatters";

export default function BudgetPlanCard({ budgetPlan, savingsGoalStatus, form }) {
  const chartData = [
    { name: "Rent", current: form.monthly_rent, suggested: budgetPlan.monthly_rent },
    { name: "Food", current: form.monthly_food, suggested: budgetPlan.monthly_food },
    { name: "Transport", current: form.monthly_transport, suggested: budgetPlan.monthly_transport },
    { name: "Entertain", current: form.monthly_entertainment, suggested: budgetPlan.monthly_entertainment },
  ];

  return (
    <details open className="detail-block">
      <summary>Suggested budget plan</summary>
      {savingsGoalStatus === "ON_TRACK" && (
        <p className="info-note">
          No budget changes needed — you already meet your savings goal.
        </p>
      )}
      
      <div className="chart-container" style={{ height: "250px", margin: "1rem 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
            />
            <Legend />
            <Bar dataKey="current" name="Current Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="suggested" name="Suggested Spend" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="budget-table">
        <tbody>
          <tr>
            <td>Rent</td>
            <td>{formatCurrency(budgetPlan.monthly_rent)}</td>
          </tr>
          <tr>
            <td>Food</td>
            <td>{formatCurrency(budgetPlan.monthly_food)}</td>
          </tr>
          <tr>
            <td>Transport</td>
            <td>{formatCurrency(budgetPlan.monthly_transport)}</td>
          </tr>
          <tr>
            <td>Entertainment</td>
            <td>{formatCurrency(budgetPlan.monthly_entertainment)}</td>
          </tr>
          <tr>
            <td><strong>Total suggested category spend</strong></td>
            <td>
              <strong>
                {formatCurrency(budgetPlan.expected_total_category_spend)}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}
