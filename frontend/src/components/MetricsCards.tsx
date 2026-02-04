import { Waves, AlertTriangle, TrendingUp, FileText } from 'lucide-react';

const metrics = [
  {
    icon: Waves,
    value: '1,247',
    label: 'Water Bodies Monitored',
    change: '+12%',
    positive: true,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500 dark:text-blue-400'
  },
  {
    icon: AlertTriangle,
    value: '23',
    label: 'Active Alerts',
    change: '-8%',
    positive: true,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-500 dark:text-red-400'
  },
  {
    icon: TrendingUp,
    value: '15%',
    label: 'Quality Improvement',
    change: '+3%',
    positive: true,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-500 dark:text-green-400'
  },
  {
    icon: FileText,
    value: '45',
    label: 'Monthly Analytics',
    change: '+24%',
    positive: true,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  }
];

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-3xl font-semibold mb-1 text-gray-900 dark:text-white transition-colors duration-200">{metric.value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
