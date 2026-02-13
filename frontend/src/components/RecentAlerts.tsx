import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertsApi } from '../services/api';

const severityConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'critical',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    label: 'high',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'medium',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    label: 'low',
  },
};

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  const mins = Math.floor(diffSec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

interface RecentAlertsProps {
  onViewAll?: () => void;
}

export function RecentAlerts({ onViewAll }: RecentAlertsProps) {
  const [alerts, setAlerts] = useState<
    Array<{
      location_name: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      parameter_name?: string | null;
      parameter?: string | null;
      alert_type: string;
      triggered_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await alertsApi.getActive({ limit: 3 });
        if (!canceled) setAlerts(res?.data ?? []);
      } catch (e: unknown) {
        if (!canceled)
          setError(
            e instanceof Error ? e.message : 'Failed to load recent alerts'
          );
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Alerts
          </h2>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading alerts…
          </div>
        )}
        {!loading && !error && alerts.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No active alerts.
          </div>
        )}
        {!loading &&
          alerts.map((alert, index) => {
            const config =
              severityConfig[alert.severity as keyof typeof severityConfig] ||
              severityConfig.medium;
            return (
              <div
                key={index}
                className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors duration-200"
              >
                <div
                  className={`w-2 h-2 ${config.dot} rounded-full mt-2`}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                      {alert.location_name}
                    </h3>
                    <span
                      className={`text-xs ${config.text} uppercase font-medium whitespace-nowrap`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {alert.parameter_name ?? alert.parameter ?? ''} •{' '}
                    {alert.alert_type}
                  </p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(alert.triggered_at)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
