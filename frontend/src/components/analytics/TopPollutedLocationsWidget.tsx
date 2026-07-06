import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { type Location } from '../../services/api';

interface Props {
  locations: Location[];
}

export function TopPollutedLocationsWidget({ locations }: Props) {
  const topPollutedLocations = useMemo(() => {
    const ranked = [...locations].sort((a, b) => {
      const aScore = a.derived_wqi_score ?? a.avg_wqi_score ?? 999;
      const bScore = b.derived_wqi_score ?? b.avg_wqi_score ?? 999;
      return aScore - bScore;
    });
    return ranked.slice(0, 5).map((l) => ({
      name: l.name,
      score: Math.round(((l.derived_wqi_score ?? l.avg_wqi_score ?? 0) as number) * 10) / 10,
      trend: (l.active_alerts ?? 0) > 0 ? 'up' : 'down',
      violations: l.active_alerts ?? 0,
    }));
  }, [locations]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Polluted Locations
      </h2>
      <div className="space-y-3">
        {topPollutedLocations.map((location, index) => (
          <div
            key={index}
            className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-900/30"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {location.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {location.violations} violations
                </div>
              </div>
              {location.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  style={{ width: `${location.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {location.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
