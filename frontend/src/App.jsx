import { useMemo, useState } from "react";
import { predictExpense } from "./api";

const defaultForm = {
  monthly_income: 9000,
  monthly_rent: 2600,
  monthly_food: 700,
  monthly_transport: 350,
  monthly_entertainment: 500,
  credit_score: 740,
};

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = useMemo(() => Object.keys(defaultForm), []);

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

  return (
    <main className="container">
      <h1>Aura Predictive Financial Engine</h1>
      <p>Real-time expense projection with risk scoring.</p>
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

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card">
          <h2>Prediction</h2>
          <p>Projected monthly expense: ${result.predicted_monthly_expense}</p>
          <p>Risk band: {result.risk_band}</p>
          <p>Confidence: {result.confidence}</p>
        </section>
      )}
    </main>
  );
}
