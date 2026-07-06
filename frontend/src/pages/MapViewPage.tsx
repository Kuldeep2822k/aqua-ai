import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { locationsApi, type Location } from '../services/api';
import { WaterQualityMap } from '../components/map/WaterQualityMap';
import { LocationDetailPanel } from '../components/map/LocationDetailPanel';
import { type MapPoint } from '../components/map/types';

export function MapViewPage() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toStatus = (loc: Location): 'critical' | 'warning' | 'good' => {
    const risk = loc.derived_risk_level;
    if (risk === 'critical' || risk === 'high') {
      return 'critical';
    }
    if (risk === 'medium') {
      return 'warning';
    }
    const score = loc.derived_wqi_score ?? loc.avg_wqi_score;
    if (score === null || score === undefined) {
      return 'warning';
    }
    if (score < 40) {
      return 'critical';
    }
    if (score < 70) {
      return 'warning';
    }
    return 'good';
  };

  const allPoints = useMemo((): MapPoint[] => {
    return locations
      .map((loc) => {
        const lat =
          typeof loc.latitude === 'string'
            ? Number.parseFloat(loc.latitude)
            : loc.latitude;
        const lng =
          typeof loc.longitude === 'string'
            ? Number.parseFloat(loc.longitude)
            : loc.longitude;

        return {
          ...loc,
          status: toStatus(loc),
          lat,
          lng,
        };
      })
      .filter((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng));
  }, [locations]);

  const filteredPoints = useMemo(() => {
    return allPoints.filter(
      (loc) => filterStatus === 'all' || loc.status === filterStatus
    );
  }, [allPoints, filterStatus]);

  // ⚡ Bolt: Wrap selectedData in useMemo to avoid O(N) .find() on every re-render
  // This prevents unnecessary array traversal when unrelated state changes (like showing/hiding readings).
  const selectedData = useMemo(() => {
    return selectedPoint
      ? allPoints.find((p) => p.id === selectedPoint) || null
      : null;
  }, [allPoints, selectedPoint]);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await locationsApi.getAll({ limit: 500, offset: 0 });
        if (!canceled && res?.success) {
          setLocations(res.data ?? []);
        }
      } catch (e: unknown) {
        if (!canceled) {
          setError(e instanceof Error ? e.message : 'Failed to load locations');
        }
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
  }, []);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, good: 0 };
    for (const p of allPoints) {
      c[p.status as keyof typeof c] += 1;
    }
    return c;
  }, [allPoints]);

  return (
    <main className="h-[calc(100vh-73px)] flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-green-950/30 transition-colors duration-200">
      {/* Top Stats Bar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-4 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Interactive Map
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time water quality monitoring across India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loading ? '…' : counts.critical}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Critical
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loading ? '…' : counts.warning}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Warning
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loading ? '…' : counts.good}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Good
                </span>
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2 bg-white/50 dark:bg-gray-800/50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        <WaterQualityMap
          filteredPoints={filteredPoints}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
          loading={loading}
          error={error}
          locations={locations}
          counts={counts}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {selectedData && (
          <LocationDetailPanel
            key={selectedData.id}
            selectedData={selectedData}
            onClose={() => setSelectedPoint(null)}
          />
        )}
      </div>
    </main>
  );
}
