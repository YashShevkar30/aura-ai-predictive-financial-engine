import { useState, useMemo } from "react";
import { fetchHistory } from "../api";

export function useHistory() {
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async (limit = 8) => {
    setHistoryLoading(true);
    setError("");
    try {
      const history = await fetchHistory(limit);
      setHistoryItems(history.items);
      return history.items;
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const chartPoints = useMemo(() => {
    if (!historyItems.length) {
      return [];
    }
    const recent = [...historyItems].slice(0, 8).reverse();
    return recent.map((item) => ({
      id: item.id,
      timeLabel: new Date(item.created_at).toLocaleTimeString(),
      expense: Number(item.output.predicted_monthly_expense),
      savings: Number(item.output.projected_monthly_savings),
      risk: item.output.risk_band,
    }));
  }, [historyItems]);

  return { historyItems, chartPoints, historyLoading, error, loadHistory };
}
