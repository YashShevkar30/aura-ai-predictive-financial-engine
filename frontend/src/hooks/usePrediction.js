import { useState } from "react";
import { predictExpense } from "../api";

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predict = async (form) => {
    setLoading(true);
    setError("");
    try {
      const prediction = await predictExpense(form);
      setResult(prediction);
      return prediction;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError("");

  return { result, loading, error, predict, clearError };
}
