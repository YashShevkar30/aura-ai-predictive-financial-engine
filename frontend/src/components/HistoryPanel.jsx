import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/formatters";
import { useHistory } from "../hooks/useHistory";

export default function HistoryPanel() {
  const { historyItems, chartPoints, historyLoading, error, loadHistory } = useHistory();

  return (
    <div className="card">
      <h2>Recent Prediction History</h2>
      <p className="muted">
        Review recent runs to track trend and discuss iterative decision-making during interviews.
      </p>
      <button disabled={historyLoading} onClick={() => loadHistory(8)} type="button">
        {historyLoading ? "Loading history..." : "Load Recent Predictions"}
      </button>

      {error && <p className="error">{error}</p>}

      {chartPoints.length > 0 && (
        <div className="chart-wrapper">
          <h3>Expense vs Savings Trend (last {chartPoints.length} runs)</h3>
          <div className="chart-container" style={{ height: "250px", marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                <Area type="monotone" dataKey="savings" name="Savings" stroke="#22c55e" fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {historyItems.length > 0 && (
        <div className="table-responsive">
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
                  <td><span className={`risk-pill-small ${item.output.risk_band === 'LOW' ? 'risk-low' : item.output.risk_band === 'MEDIUM' ? 'risk-medium' : 'risk-high'}`}>{item.output.risk_band}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
