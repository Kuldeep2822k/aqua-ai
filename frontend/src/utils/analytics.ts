export function riskToBucket(
  risk: string | null | undefined
): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') {
    return 'critical';
  }
  if (risk === 'medium') {
    return 'warning';
  }
  return 'good';
}

export function riskToScore(risk: string | null | undefined) {
  const r = riskToBucket(risk);
  if (r === 'critical') {
    return 20;
  }
  if (r === 'warning') {
    return 70;
  }
  return 90;
}

export function computePeriodRange(period: string) {
  const now = new Date();
  const days =
    period === 'weekly'
      ? 7
      : period === 'quarterly'
        ? 90
        : period === 'yearly'
          ? 365
          : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start_date: start.toISOString(), end_date: now.toISOString() };
}
