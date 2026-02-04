import { AlertTriangle } from 'lucide-react';

const alerts = [
  {
    location: 'Yamuna River, Delhi',
    parameter: 'High BOD',
    value: '>5.8 mg/L',
    severity: 'high',
    time: '3h ago'
  },
  {
    location: 'Ganga River, Varanasi',
    parameter: 'Heavy Metals',
    value: '>0.18 mg/L Lead',
    severity: 'critical',
    time: '5h ago'
  },
  {
    location: 'Krishna River, Vijayawada',
    parameter: 'TDS',
    value: '800 ppm',
    severity: 'warning',
    time: '8h ago'
  }
];

const severityConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'critical'
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    label: 'high'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'warning'
  }
};

export function RecentAlerts() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
        </div>
        <button className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">View All</button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig];
          return (
            <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors duration-200">
              <div className={`w-2 h-2 ${config.dot} rounded-full mt-2`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white">{alert.location}</h3>
                  <span className={`text-xs ${config.text} uppercase font-medium whitespace-nowrap`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {alert.parameter} - {alert.value}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">{alert.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
