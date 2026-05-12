import { useMemo } from "react";

export default function PredictionForm({ form, setForm, onSubmit, loading }) {
  const fields = useMemo(
    () => [
      "monthly_income",
      "monthly_rent",
      "monthly_food",
      "monthly_transport",
      "monthly_entertainment",
      "savings_goal_monthly",
      "credit_score",
    ],
    []
  );

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
    []
  );

  function applyPreset(preset) {
    setForm((prev) => ({ ...prev, ...preset }));
  }

  return (
    <div className="card">
      <h2>Scenario A · Run Prediction</h2>
      <p className="muted">
        Enter your profile and generate expense forecast with decision guidance.
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

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
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
  );
}
