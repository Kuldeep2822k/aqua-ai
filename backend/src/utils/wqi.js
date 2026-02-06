function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function interpolate(value, a, b, scoreA, scoreB) {
  if (a === b) return scoreB;
  const t = (value - a) / (b - a);
  return scoreA + t * (scoreB - scoreA);
}

function scoreForReading(paramCode, value, limits) {
  const safe = Number(limits.safe_limit);
  const moderate = Number(limits.moderate_limit);
  const high = Number(limits.high_limit);
  const critical = Number(limits.critical_limit);

  if (
    [safe, moderate, high, critical].some(
      (n) => Number.isNaN(n) || !Number.isFinite(n)
    )
  ) {
    return null;
  }

  if (paramCode === 'pH') {
    if (value >= safe && value <= moderate) return 100;
    const dist =
      value < safe ? safe - value : value > moderate ? value - moderate : 0;
    if (dist <= 0.5) return 85;
    if (dist <= 1) return 70;
    if (dist <= 1.5) return 50;
    if (dist <= 2) return 30;
    return 0;
  }

  if (paramCode === 'DO') {
    if (value >= safe) return 100;
    if (value >= moderate)
      return clamp(interpolate(value, moderate, safe, 75, 100), 0, 100);
    if (value >= high)
      return clamp(interpolate(value, high, moderate, 50, 75), 0, 100);
    if (value >= critical)
      return clamp(interpolate(value, critical, high, 25, 50), 0, 100);
    return 0;
  }

  if (value <= safe) return 100;
  if (value <= moderate)
    return clamp(interpolate(value, safe, moderate, 100, 75), 0, 100);
  if (value <= high)
    return clamp(interpolate(value, moderate, high, 75, 50), 0, 100);
  if (value <= critical)
    return clamp(interpolate(value, high, critical, 50, 25), 0, 100);
  return 0;
}

function categoryForScore(score) {
  if (score === null || Number.isNaN(score)) return null;
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'critical';
}

function riskLevelForScore(score) {
  if (score === null || Number.isNaN(score)) return null;
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function computeDerivedWqi(latestReadings) {
  const scores = [];
  for (const r of latestReadings) {
    const value = Number(r.value);
    if (Number.isNaN(value) || !Number.isFinite(value)) continue;
    const s = scoreForReading(String(r.parameter_code), value, r);
    if (s === null) continue;
    scores.push(s);
  }

  if (scores.length === 0) {
    return {
      score: null,
      category: null,
      risk_level: null,
      parameters_used: 0,
    };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const score = Math.round(avg * 100) / 100;
  return {
    score,
    category: categoryForScore(score),
    risk_level: riskLevelForScore(score),
    parameters_used: scores.length,
  };
}

module.exports = { computeDerivedWqi };
