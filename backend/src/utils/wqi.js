function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function interpolate(value, a, b, scoreA, scoreB) {
  if (a === b) {
    return scoreB;
  }
  const t = (value - a) / (b - a);
  return scoreA + t * (scoreB - scoreA);
}

function scoreForPH(value, safe, moderate) {
  if (value >= safe && value <= moderate) {
    return 100;
  }
  const dist = Math.max(safe - value, value - moderate, 0);
  const thresholds = [
    { max: 0.5, score: 85 },
    { max: 1.0, score: 70 },
    { max: 1.5, score: 50 },
    { max: 2.0, score: 30 },
  ];
  const bucket = thresholds.find((t) => dist <= t.max);
  return bucket ? bucket.score : 0;
}

function scoreForRange(value, limits, isHigherBetter) {
  const passes = (limit) => (isHigherBetter ? value >= limit : value <= limit);
  if (passes(limits.safe)) {
    return 100;
  }
  if (passes(limits.moderate)) {
    return clamp(interpolate(value, limits.safe, limits.moderate, 100, 75), 0, 100);
  }
  if (passes(limits.high)) {
    return clamp(interpolate(value, limits.moderate, limits.high, 75, 50), 0, 100);
  }
  if (passes(limits.critical)) {
    return clamp(interpolate(value, limits.high, limits.critical, 50, 25), 0, 100);
  }
  return 0;
}

function scoreForDO(value, safe, moderate, high, critical) {
  return scoreForRange(value, { safe, moderate, high, critical }, true);
}

function scoreForStandard(value, safe, moderate, high, critical) {
  return scoreForRange(value, { safe, moderate, high, critical }, false);
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
    return scoreForPH(value, safe, moderate);
  }

  if (paramCode === 'DO') {
    return scoreForDO(value, safe, moderate, high, critical);
  }

  return scoreForStandard(value, safe, moderate, high, critical);
}

function evaluateScore(score, thresholds, labels) {
  if (score === null || Number.isNaN(score)) {
    return null;
  }
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]) {
      return labels[i];
    }
  }
  return labels[labels.length - 1];
}

function categoryForScore(score) {
  return evaluateScore(
    score,
    [90, 70, 50, 25],
    ['excellent', 'good', 'fair', 'poor', 'critical']
  );
}

function riskLevelForScore(score) {
  return evaluateScore(
    score,
    [80, 60, 40],
    ['low', 'medium', 'high', 'critical']
  );
}

function computeDerivedWqi(latestReadings) {
  const scores = [];
  for (const r of latestReadings) {
    const value = Number(r.value);
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      continue;
    }
    const s = scoreForReading(String(r.parameter_code), value, r);
    if (s === null) {
      continue;
    }
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
