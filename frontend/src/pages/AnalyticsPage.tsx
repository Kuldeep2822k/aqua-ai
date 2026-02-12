import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Droplet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
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

function riskToBucket(
  risk: string | null | undefined
): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') return 'critical';
  if (risk === 'medium') return 'warning';
  return 'good';
}

function riskToScore(risk: string | null | undefined) {
  const r = riskToBucket(risk);
  if (r === 'critical') return 20;
  if (r === 'warning') return 70;
  return 90;
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

        if (canceled) return;

        setWaterStats(waterStatsRes?.data ?? null);
        setAlertStats(alertStatsRes?.data ?? null);
        setLocationStats(locationStatsRes?.data ?? null);
        setLocations(locationsRes?.data ?? []);
        setReadings(readingsRes?.data ?? []);
        setAlerts(alertsRes?.data ?? []);
        setParameters(parametersRes?.data ?? []);
      } catch (e: unknown) {
        if (canceled) return;
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
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [selectedPeriod]);

  const avgQualityScore = useMemo(() => {
    if (waterStats?.average_quality_score)
      return Number(waterStats.average_quality_score);
    if (!waterStats?.risk_level_distribution) return null;
    const dist = waterStats.risk_level_distribution;
    const total =
      (dist.low ?? 0) +
      (dist.medium ?? 0) +
      (dist.high ?? 0) +
      (dist.critical ?? 0);
    if (!total) return null;
    const score =
      (dist.low ?? 0) * 90 +
      (dist.medium ?? 0) * 70 +
      (dist.high ?? 0) * 40 +
      (dist.critical ?? 0) * 20;
    return score / total;
  }, [waterStats]);

  const monthlyTrends = useMemo(() => {
    const buckets = new Map<
      string,
      { month: string; critical: number; warning: number; good: number }
    >();
    for (const r of readings) {
      const d = new Date(r.measurement_date);
      if (!Number.isFinite(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = d.toLocaleString(undefined, { month: 'short' });
      const existing = buckets.get(key) || {
        month,
        critical: 0,
        warning: 0,
        good: 0,
      };
      const bucket = riskToBucket(r.risk_level);
      existing[bucket] += 1;
      buckets.set(key, existing);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => v);
  }, [readings]);

  const stateDistribution = useMemo(() => {
    const counts = { Critical: 0, Warning: 0, Good: 0 };
    for (const l of locations) {
      const bucket = riskToBucket(l.derived_risk_level || null);
      if (bucket === 'critical') counts.Critical += 1;
      else if (bucket === 'warning') counts.Warning += 1;
      else counts.Good += 1;
    }
    return [
      { name: 'Critical', value: counts.Critical, color: '#ef4444' },
      { name: 'Warning', value: counts.Warning, color: '#eab308' },
      { name: 'Good', value: counts.Good, color: '#22c55e' },
    ];
  }, [locations]);

  const parameterData = useMemo(() => {
    const thresholdByCode = new Map<string, number | null>();
    for (const p of parameters) {
      if (p?.code) thresholdByCode.set(String(p.code), p.safe_limit ?? null);
    }

    const grouped = new Map<
      string,
      {
        parameter: string;
        violations: number;
        sum: number;
        count: number;
        threshold: number | null;
      }
    >();
    for (const r of readings) {
      const code = r.parameter_code;
      const entry = grouped.get(code) || {
        parameter: code,
        violations: 0,
        sum: 0,
        count: 0,
        threshold: thresholdByCode.get(code) ?? null,
      };
      if (riskToBucket(r.risk_level) !== 'good') entry.violations += 1;
      entry.sum += Number(r.value);
      entry.count += 1;
      grouped.set(code, entry);
    }

    return Array.from(grouped.values())
      .map((g) => ({
        parameter: g.parameter,
        violations: g.violations,
        avg: g.count ? Math.round((g.sum / g.count) * 100) / 100 : 0,
        threshold: g.threshold,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 6);
  }, [parameters, readings]);

  const maxViolations = useMemo(
    () => Math.max(1, ...parameterData.map((param) => param.violations)),
    [parameterData]
  );

  const topPollutedLocations = useMemo(() => {
    const ranked = [...locations].sort((a, b) => {
      const aScore = a.derived_wqi_score ?? a.avg_wqi_score ?? 999;
      const bScore = b.derived_wqi_score ?? b.avg_wqi_score ?? 999;
      return aScore - bScore;
    });
    return ranked.slice(0, 5).map((l) => ({
      name: l.name,
      score:
        Math.round(
          ((l.derived_wqi_score ?? l.avg_wqi_score ?? 0) as number) * 10
        ) / 10,
      trend: (l.active_alerts ?? 0) > 0 ? 'up' : 'down',
      violations: l.active_alerts ?? 0,
    }));
  }, [locations]);

  const waterQualityTrend = useMemo(() => {
    const range = computePeriodRange(selectedPeriod);
    const start = new Date(range.start_date).getTime();
    const end = new Date(range.end_date).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
      return [];
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
      if (!Number.isFinite(t)) continue;
      const idx = Math.min(
        buckets - 1,
        Math.max(0, Math.floor(((t - start) / (end - start)) * buckets))
      );
      data[idx]._qSum += riskToScore(r.risk_level);
      data[idx]._qCount += 1;
    }

    for (const a of alerts) {
      const t = new Date(a.triggered_at).getTime();
      if (!Number.isFinite(t)) continue;
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
            {/* Water Quality Trend */}
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
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={waterQualityTrend}>
                  <defs>
                    <linearGradient
                      id="colorQuality"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    className="dark:opacity-20"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)',
                    }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQuality)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Alert Distribution
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Breakdown by severity level
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    className="dark:opacity-20"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)',
                    }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                  <Legend />
                  <Bar
                    dataKey="critical"
                    fill="#ef4444"
                    name="Critical"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="warning"
                    fill="#eab308"
                    name="Warning"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="good"
                    fill="#22c55e"
                    name="Good"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Parameter Violations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Parameter Violations
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Most frequently violated parameters
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {parameterData.map((param, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {param.parameter}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            style={{
                              width: `${(param.violations / maxViolations) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                          {param.violations}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Avg: {param.avg} | Threshold: {param.threshold}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Status
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={stateDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stateDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)',
                    }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {stateDistribution.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value} locations
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Polluted Locations */}
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
