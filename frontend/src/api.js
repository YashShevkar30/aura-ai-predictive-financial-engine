const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export async function predictExpense(payload) {
  const response = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Prediction request failed");
  }
  return response.json();
}
