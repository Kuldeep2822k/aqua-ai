import { MapPin, Clock } from 'lucide-react';
import { type Alert } from '../../services/api';
import { timeAgo, severityConfig, statusConfig } from './alertUtils';

interface Props {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  selectedAlert: number | null;
  setSelectedAlert: (id: number | null) => void;
}

export function AlertList({
  alerts,
  loading,
  error,
  selectedAlert,
  setSelectedAlert,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {error && (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {loading && (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading alerts…
        </div>
      )}
      {!loading &&
        !error &&
        alerts.map((alert) => {
          const severity =
            severityConfig[alert.severity as keyof typeof severityConfig] ||
            severityConfig.medium;
          const status =
            statusConfig[alert.status as keyof typeof statusConfig] ||
            statusConfig.active;
          const StatusIcon = status.icon;
          const isSelected = selectedAlert === alert.id;

          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => setSelectedAlert(alert.id)}
              className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 ${severity.badge} rounded-full mt-2 flex-shrink-0`}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                      {alert.alert_type} • {alert.parameter}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1 whitespace-nowrap`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    {alert.location_name}
                  </div>

                  <div
                    className={`text-xs ${severity.color} font-medium mb-2`}
                  >
                    {alert.parameter}:{' '}
                    {alert.actual_value === null || alert.actual_value === undefined
                      ? 'N/A'
                      : alert.actual_value}{' '}
                    (Threshold:{' '}
                    {alert.threshold_value === null || alert.threshold_value === undefined
                      ? 'N/A'
                      : alert.threshold_value}
                    )
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(alert.triggered_at)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${severity.bg} ${severity.color}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
    </div>
  );
}
