export default function HowAuraDecides() {
  return (
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
  );
}
