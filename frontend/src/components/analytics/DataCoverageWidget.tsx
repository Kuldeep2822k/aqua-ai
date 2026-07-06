import { type WaterQualityReading, type WaterQualityStats } from '../../services/api';

type WaterQualityParameter = {
  code: string;
  name: string;
  unit: string;
  safe_limit: number | null;
  moderate_limit: number | null;
  high_limit: number | null;
  critical_limit: number | null;
  description?: string | null;
};

interface Props {
  loading: boolean;
  readings: WaterQualityReading[];
  parameters: WaterQualityParameter[];
  waterStats: WaterQualityStats | null;
}

export function DataCoverageWidget({ loading, readings, parameters, waterStats }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Data Coverage
      </h2>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Readings Loaded
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {loading ? '…' : readings.length.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Parameters Monitored
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {loading ? '…' : parameters.length.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Latest Reading
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {loading
              ? '…'
              : waterStats?.latest_reading
                ? new Date(waterStats.latest_reading).toLocaleString()
                : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
