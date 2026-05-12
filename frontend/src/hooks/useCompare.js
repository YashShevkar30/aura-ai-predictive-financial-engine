import { useState } from "react";
import { compareScenarios } from "../api";

export function useCompare() {
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState("");

  const compare = async (payload) => {
    setCompareLoading(true);
    setError("");
    try {
      const comparison = await compareScenarios(payload);
      setCompareResult(comparison);
      return comparison;
    } catch (err) {
      setError(err.message);
    } finally {
      setCompareLoading(false);
    }
  };

  return { compareResult, compareLoading, error, compare };
}
