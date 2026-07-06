import { Download, FileText, BarChart3, Activity, Droplet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  alertsApi,
  locationsApi,
  waterQualityApi,
  type Alert,
  type AlertStats,
  type Location,
  type LocationStats,
  type WaterQualityReading,
  type WaterQualityStats,
} from '../services/api';

import { WaterQualityTrendWidget } from '../components/analytics/WaterQualityTrendWidget';
import { MonthlyAlertDistributionWidget } from '../components/analytics/MonthlyAlertDistributionWidget';
import { ParameterViolationsWidget } from '../components/analytics/ParameterViolationsWidget';
import { StatusDistributionWidget } from '../components/analytics/StatusDistributionWidget';
import { TopPollutedLocationsWidget } from '../components/analytics/TopPollutedLocationsWidget';
import { DataCoverageWidget } from '../components/analytics/DataCoverageWidget';

export type WaterQualityParameter = {
  code: string;
  name: string;
  unit: string;
  safe_limit: number | null;
  moderate_limit: number | null;
  high_limit: number | null;
  critical_limit: number | null;
  description?: string | null;
};

function computePeriodRange(period: string) {
  const now = new Date();
  const days =
    period === 'weekly'
      ? 7
      : period === 'quarterly'
        ? 90
        : period === 'yearly'
          ? 365
          : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start_date: start.toISOString(), end_date: now.toISOString() };
}

export function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterStats, setWaterStats] = useState<WaterQualityStats | null>(null);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(
    null
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [parameters, setParameters] = useState<WaterQualityParameter[]>([]);

  useEffect(() => {
    let canceled = false;
    const range = computePeriodRange(selectedPeriod);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          waterStatsRes,
          alertStatsRes,
          locationStatsRes,
          locationsRes,
          readingsRes,
          alertsRes,
          parametersRes,
        ] = await Promise.all([
          waterQualityApi.getStats(),
          alertsApi.getStats(range),
          locationsApi.getStats(),
          locationsApi.getAll({ limit: 500, offset: 0 }),
          waterQualityApi.getAllReadings({ ...range }),
          alertsApi.getAll({ ...range, limit: 1000, offset: 0 }),
          waterQualityApi.getParameters(),
        ]);

        if (canceled) {
          return;
        }

        setWaterStats(waterStatsRes?.data ?? null);
        setAlertStats(alertStatsRes?.data ?? null);
        setLocationStats(locationStatsRes?.data ?? null);
        setLocations(locationsRes?.data ?? []);
        setReadings(readingsRes?.data ?? []);
        setAlerts(alertsRes?.data ?? []);
        setParameters(parametersRes?.data ?? []);
      } catch (e: unknown) {
        if (canceled) {
          return;
        }
        setError(
          e instanceof Error ? e.message : 'Failed to load analytics data'
        );
        setWaterStats(null);
        setAlertStats(null);
        setLocationStats(null);
        setLocations([]);
        setReadings([]);
        setAlerts([]);
        setParameters([]);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [selectedPeriod]);

  const avgQualityScore = useMemo(() => {
    if (waterStats?.average_quality_score) {
      return Number(waterStats.average_quality_score);
    }
    if (!waterStats?.risk_level_distribution) {
      return null;
    }
    const dist = waterStats.risk_level_distribution;
    const total =
      (dist.low ?? 0) +
      (dist.medium ?? 0) +
      (dist.high ?? 0) +
      (dist.critical ?? 0);
    if (!total) {
      return null;
    }
    const score =
      (dist.low ?? 0) * 90 +
      (dist.medium ?? 0) * 70 +
      (dist.high ?? 0) * 40 +
      (dist.critical ?? 0) * 20;
    return score / total;
  }, [waterStats]);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-gray-900 dark:to-blue-950/30 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-6 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Analytics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive water quality insights and data analysis
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                aria-label="Select period"
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="quarterly">Last 3 Months</option>
                <option value="yearly">Last Year</option>
              </select>

              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Readings
                </span>
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading
                  ? '…'
                  : (waterStats?.total_readings ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                From API responses
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Quality Score
                </span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading
                  ? '…'
                  : avgQualityScore === null
                    ? 'N/A'
                    : `${avgQualityScore.toFixed(1)}`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Computed from risk distribution
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Alerts
                </span>
                <BarChart3 className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading
                  ? '…'
                  : (alertStats?.active_alerts ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Within selected range
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Locations Monitored
                </span>
                <Droplet className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading
                  ? '…'
                  : (locationStats?.total_locations ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across {loading ? '…' : (locationStats?.states_covered ?? 0)}{' '}
                states
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            <WaterQualityTrendWidget
              readings={readings}
              alerts={alerts}
              selectedPeriod={selectedPeriod}
            />
            <MonthlyAlertDistributionWidget readings={readings} />
            <ParameterViolationsWidget
              parameters={parameters}
              readings={readings}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <StatusDistributionWidget locations={locations} />
            <TopPollutedLocationsWidget locations={locations} />
            <DataCoverageWidget
              loading={loading}
              readings={readings}
              parameters={parameters}
              waterStats={waterStats}
            />
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export
            </h2>
            <button className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Export uses live API-backed data for the selected time range.
          </div>
        </div>
      </div>
    </main>
  );
}
