import { formatCoef } from "../utils/formatters";

export default function ModelExplainer({ coefficientTerms }) {
  const factors = [
    {
      key: "income",
      label: "Income",
      icon: "💰",
      coef: coefficientTerms.income,
      explain: coefficientTerms.income > 0
        ? "Higher income tends to correlate with higher predicted spending."
        : "Higher income slightly reduces predicted spending in this model.",
    },
    {
      key: "rent",
      label: "Rent",
      icon: "🏠",
      coef: coefficientTerms.rent,
      explain: coefficientTerms.rent > 0
        ? "Higher rent increases the model's expense estimate."
        : "Higher rent spending actually lowers the predicted total (possibly because it crowds out other spending).",
    },
    {
      key: "food",
      label: "Food",
      icon: "🍽️",
      coef: coefficientTerms.food,
      explain: coefficientTerms.food > 0
        ? "Larger food budgets push predicted expenses higher."
        : "Larger food spending correlates with lower total predicted expense in the model.",
    },
    {
      key: "transport",
      label: "Transport",
      icon: "🚗",
      coef: coefficientTerms.transport,
      explain: coefficientTerms.transport > 0
        ? "Higher transport costs increase the expense prediction."
        : "Higher transport spending correlates with reduced total prediction.",
    },
    {
      key: "entertainment",
      label: "Entertainment",
      icon: "🎬",
      coef: coefficientTerms.entertainment,
      explain: coefficientTerms.entertainment > 0
        ? "More entertainment spending raises predicted total expenses."
        : "Higher entertainment spending is associated with lower total prediction.",
    },
    {
      key: "credit_score",
      label: "Credit Score",
      icon: "📊",
      coef: coefficientTerms.credit_score,
      explain: coefficientTerms.credit_score < 0
        ? "A stronger credit score reduces predicted spending — financially disciplined profiles tend to spend less."
        : "Credit score has a positive association with spending in this model.",
    },
  ];

  return (
    <details className="detail-block">
      <summary>How Each Factor Affects Your Prediction</summary>

      <p className="viz-subtitle" style={{ marginTop: "0.5rem" }}>
        The model learned these relationships from training data. Each factor has a
        &quot;weight&quot; — a positive weight means that factor pushes your prediction up,
        and a negative weight pulls it down.
      </p>

      <div className="factor-explain-grid">
        {factors.map((f) => (
          <div key={f.key} className="factor-explain-card">
            <div className="factor-explain-header">
              <span className="factor-explain-icon">{f.icon}</span>
              <strong>{f.label}</strong>
              <span className={`factor-weight ${f.coef >= 0 ? "weight-positive" : "weight-negative"}`}>
                {f.coef >= 0 ? "+" : ""}{formatCoef(f.coef)}
              </span>
            </div>
            <p className="factor-explain-text">{f.explain}</p>
          </div>
        ))}
      </div>

      <div className="model-meta-strip">
        <span>🤖 Model: Ridge Regression (Linear)</span>
        <span>📐 Baseline: {formatCoef(coefficientTerms.bias)}</span>
      </div>
    </details>
  );
}
