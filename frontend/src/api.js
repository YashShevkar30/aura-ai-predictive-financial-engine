const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

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

export async function compareScenarios(payload) {
  const response = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Scenario comparison failed");
  }
  return response.json();
}

export async function fetchHistory(limit = 8) {
  const response = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error("History fetch failed");
  }
  return response.json();
}
