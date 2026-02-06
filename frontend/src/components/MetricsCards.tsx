import { Waves, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { alertsApi, locationsApi, waterQualityApi } from '../services/api';

export function MetricsCards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationsTotal, setLocationsTotal] = useState<number | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);
  const [avgWqiScore, setAvgWqiScore] = useState<string | null>(null);
  const [totalReadings, setTotalReadings] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [locStats, alertStats, waterStats] = await Promise.all([
          locationsApi.getStats(),
          alertsApi.getStats(),
          waterQualityApi.getStats(),
        ]);

        if (canceled) return;

        setLocationsTotal(locStats?.data?.total_locations ?? null);
        setActiveAlerts(alertStats?.data?.active_alerts ?? null);
        setAvgWqiScore(locStats?.data?.average_wqi_score ?? null);
        setTotalReadings(waterStats?.data?.total_readings ?? null);
      } catch (e: unknown) {
        if (canceled) return;
        setError(e instanceof Error ? e.message : 'Failed to load metrics');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    return [
      {
        icon: Waves,
        value:
          locationsTotal === null ? '—' : locationsTotal.toLocaleString(),
        label: 'Water Bodies Monitored',
        change: 'LIVE',
        positive: true,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-500 dark:text-blue-400',
      },
      {
        icon: AlertTriangle,
        value: activeAlerts === null ? '—' : activeAlerts.toLocaleString(),
        label: 'Active Alerts',
        change: 'LIVE',
        positive: true,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-500 dark:text-red-400',
      },
      {
        icon: TrendingUp,
        value:
          avgWqiScore === null || avgWqiScore === undefined ? 'N/A' : avgWqiScore,
        label: 'Average WQI Score',
        change: 'LIVE',
        positive: true,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-500 dark:text-green-400',
      },
      {
        icon: FileText,
        value:
          totalReadings === null ? '—' : totalReadings.toLocaleString(),
        label: 'Total Readings',
        change: 'LIVE',
        positive: true,
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      },
    ];
  }, [activeAlerts, avgWqiScore, locationsTotal, totalReadings]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {error && (
        <div className="md:col-span-2 lg:col-span-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
          {error}
        </div>
      )}
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center transition-colors duration-200`}>
              <metric.icon className={`w-6 h-6 ${metric.iconColor} transition-colors duration-200`} />
            </div>
            <span className={`text-sm font-medium ${metric.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} transition-colors duration-200`}>
              {metric.change}
            </span>
          </div>
          <div className="text-3xl font-semibold mb-1 text-gray-900 dark:text-white transition-colors duration-200">
            {loading ? '…' : metric.value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
