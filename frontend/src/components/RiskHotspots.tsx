import { MapPin, MoreVertical } from 'lucide-react';

const hotspots = [
  {
    location: 'Dadar NCPA',
    affected: '2.8M affected',
    severity: 'critical'
  },
  {
    location: 'Mumbai Metro',
    affected: '1.5M affected',
    severity: 'warning'
  },
  {
    location: 'Juinagar Urban',
    affected: '1.4M affected',
    severity: 'warning'
  },
  {
    location: 'Chennai Metro',
    affected: '1.9M affected',
    severity: 'warning'
  }
];

const severityDot = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500'
};

export function RiskHotspots() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Hotspots</h2>
        </div>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {hotspots.map((hotspot, index) => (
          <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors duration-200">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200">
              <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">{hotspot.location}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{hotspot.affected}</p>
            </div>
            <div className={`w-2 h-2 ${severityDot[hotspot.severity as keyof typeof severityDot]} rounded-full`}></div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 transition-colors duration-200">© 2025 Aqua-AI Systems. All rights reserved.</p>
    </div>
  );
}
