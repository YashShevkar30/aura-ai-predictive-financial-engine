export function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function formatCoef(value) {
  return Number(value ?? 0).toFixed(4);
}

export function signedCoef(value) {
  const numeric = Number(value ?? 0);
  return `${numeric >= 0 ? "+" : "-"} ${Math.abs(numeric).toFixed(4)}`;
}

export function projectionDeltaMessage(deltaValue) {
  const delta = Number(deltaValue ?? 0);
  const absDelta = formatCurrency(Math.abs(delta));
  if (delta >= 0) {
    return `You may spend about ${absDelta} above your entered category budget in the upcoming month.`;
  }
  return `You may spend about ${absDelta} below your entered category budget in the upcoming month.`;
}

export function riskClass(riskBand) {
  if (riskBand === "LOW") return "risk-pill risk-low";
  if (riskBand === "MEDIUM") return "risk-pill risk-medium";
  return "risk-pill risk-high";
}

export function ratioExplanation(ratio) {
  if (ratio < 0.55) {
    return "LOW risk means estimated spending is comfortably below your income.";
  }
  if (ratio < 0.75) {
    return "MEDIUM risk means estimated spending uses a moderate share of your income.";
  }
  return "HIGH risk means estimated spending is close to or above a high share of your income.";
}
