import { MapPin, MoreVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { locationsApi, type Location } from '../services/api';

const severityDot = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

function formatAffected(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Population: N/A';
  if (value >= 1_000_000)
    return `Population: ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Population: ${(value / 1_000).toFixed(1)}K`;
  return `Population: ${value.toLocaleString()}`;
}

function toHotspotSeverity(
  loc: Location
): 'critical' | 'high' | 'medium' | 'low' {
  const risk = loc.derived_risk_level;
  if (risk === 'critical') return 'critical';
  if (risk === 'high') return 'high';
  if (risk === 'medium') return 'medium';
  return 'low';
}

export function RiskHotspots() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await locationsApi.getGeoJSON();
        const features = res?.data?.features ?? [];
        const locs = features.map((f) => f.properties);
        if (!canceled) setLocations(locs);
      } catch (e: unknown) {
        if (!canceled)
          setError(e instanceof Error ? e.message : 'Failed to load hotspots');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  // ⚡ Bolt: Pre-compute severity ranks and derived values in a single O(N) pass before sorting.
  // This avoids calling `toHotspotSeverity` repeatedly during the O(N log N) sort comparisons.
  const hotspots = useMemo(() => {
    const severityRank: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const enriched = locations.map((loc) => {
      const severity = toHotspotSeverity(loc);
      return {
        loc,
        severity,
        rank: severityRank[severity],
        alerts: loc.active_alerts ?? 0,
        population: loc.population_affected ?? 0,
      };
    });

    enriched.sort((a, b) => {
      const sevDelta = a.rank - b.rank;
      if (sevDelta !== 0) return sevDelta;
      const alertsDelta = b.alerts - a.alerts;
      if (alertsDelta !== 0) return alertsDelta;
      return b.population - a.population;
    });

    return enriched.slice(0, 4).map(({ loc, severity, population }) => ({
      location: loc.name,
      affected: formatAffected(population),
      severity,
    }));
  }, [locations]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Risk Hotspots
          </h2>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading hotspots…
          </div>
        )}
        {!loading && !error && hotspots.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No hotspots available.
          </div>
        )}
        {!loading &&
          !error &&
          hotspots.map((hotspot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200">
                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                  {hotspot.location}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hotspot.affected}
                </p>
              </div>
              <div
                className={`w-2 h-2 ${severityDot[hotspot.severity]} rounded-full`}
              ></div>
            </div>
          ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 transition-colors duration-200">
        © {year} Aqua-AI Systems. All rights reserved.
      </p>
    </div>
  );
}
