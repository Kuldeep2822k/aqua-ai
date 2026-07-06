import { Suspense, useMemo, lazy } from 'react';
import { Download } from 'lucide-react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { type Alert, type WaterQualityReading } from '../../services/api';

const WaterQualityTrendChart = lazy(() =>
  import('./AnalyticsCharts').then((mod) => ({
    default: mod.WaterQualityTrendChart,
  }))
);

function riskToBucket(risk: string | null | undefined): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') {return 'critical';}
  if (risk === 'medium') {return 'warning';}
  return 'good';
}

function riskToScore(risk: string | null | undefined) {
  const r = riskToBucket(risk);
  if (r === 'critical') {return 20;}
  if (r === 'warning') {return 70;}
  return 90;
}

function computePeriodRange(period: string) {
  const now = new Date();
  const days =
    period === 'weekly' ? 7 : period === 'quarterly' ? 90 : period === 'yearly' ? 365 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start_date: start.toISOString(), end_date: now.toISOString() };
}

interface Props {
  readings: WaterQualityReading[];
  alerts: Alert[];
  selectedPeriod: string;
}

export function WaterQualityTrendWidget({ readings, alerts, selectedPeriod }: Props) {
  const waterQualityTrend = useMemo(() => {
    const range = computePeriodRange(selectedPeriod);
    const start = new Date(range.start_date).getTime();
    const end = new Date(range.end_date).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return [];
    }
    const buckets = 6;
    const data = Array.from({ length: buckets }, (_, i) => ({
      date: `Period ${i + 1}`,
      quality: 0,
      alerts: 0,
      _qSum: 0,
      _qCount: 0,
    }));

    for (const r of readings) {
      const t = new Date(r.measurement_date).getTime();
      if (!Number.isFinite(t)) {continue;}
      const idx = Math.min(
        buckets - 1,
        Math.max(0, Math.floor(((t - start) / (end - start)) * buckets))
      );
      data[idx]._qSum += riskToScore(r.risk_level);
      data[idx]._qCount += 1;
    }

    for (const a of alerts) {
      const t = new Date(a.triggered_at).getTime();
      if (!Number.isFinite(t)) {continue;}
      const idx = Math.min(
        buckets - 1,
        Math.max(0, Math.floor(((t - start) / (end - start)) * buckets))
      );
      data[idx].alerts += 1;
    }

    return data.map((d) => ({
      date: d.date,
      quality: d._qCount ? Math.round((d._qSum / d._qCount) * 10) / 10 : 0,
      alerts: d.alerts,
    }));
  }, [alerts, readings, selectedPeriod]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Water Quality Trend
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Average quality score over time
          </p>
        </div>
        <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          }
        >
          <WaterQualityTrendChart data={waterQualityTrend} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
