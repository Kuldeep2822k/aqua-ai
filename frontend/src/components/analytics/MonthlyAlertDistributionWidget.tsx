import { Suspense, useMemo, lazy } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { type WaterQualityReading } from '../../services/api';

const MonthlyTrendsChart = lazy(() =>
  import('./AnalyticsCharts').then((mod) => ({
    default: mod.MonthlyTrendsChart,
  }))
);

function riskToBucket(risk: string | null | undefined): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') {return 'critical';}
  if (risk === 'medium') {return 'warning';}
  return 'good';
}

interface Props {
  readings: WaterQualityReading[];
}

export function MonthlyAlertDistributionWidget({ readings }: Props) {
  const monthlyTrends = useMemo(() => {
    const buckets = new Map<
      string,
      { month: string; critical: number; warning: number; good: number }
    >();
    const monthFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
    });
    for (const r of readings) {
      const d = new Date(r.measurement_date);
      if (!Number.isFinite(d.getTime())) {
        continue;
      }
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = monthFormatter.format(d);
      const existing = buckets.get(key) || {
        month,
        critical: 0,
        warning: 0,
        good: 0,
      };
      const bucket = riskToBucket(r.risk_level);
      existing[bucket] += 1;
      buckets.set(key, existing);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => v);
  }, [readings]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Alert Distribution
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Breakdown by severity level
          </p>
        </div>
      </div>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          }
        >
          <MonthlyTrendsChart data={monthlyTrends} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
