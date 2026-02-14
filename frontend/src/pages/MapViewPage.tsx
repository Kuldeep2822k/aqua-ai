import {
  Download,
  Filter,
  MapPin,
  Activity,
  Droplet,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  locationsApi,
  waterQualityApi,
  type Location,
  type WaterQualityReading,
} from '../services/api';

type MapPoint = Location & {
  status: 'critical' | 'warning' | 'good';
  lat: number;
  lng: number;
};

const statusBgColors = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  good: 'bg-green-500',
};

const statusLabels = {
  critical: 'Critical',
  warning: 'Warning',
  good: 'Good',
};

export function MapViewPage() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReadings, setShowReadings] = useState(false);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);

  const toStatus = (loc: Location): 'critical' | 'warning' | 'good' => {
    const risk = loc.derived_risk_level;
    if (risk === 'critical' || risk === 'high') return 'critical';
    if (risk === 'medium') return 'warning';
    const score = loc.derived_wqi_score ?? loc.avg_wqi_score;
    if (score === null || score === undefined) return 'warning';
    if (score < 40) return 'critical';
    if (score < 70) return 'warning';
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

  const selectedData = selectedPoint
    ? allPoints.find((p) => p.id === selectedPoint) || null
    : null;

  useEffect(() => {
    setShowReadings(false);
    setReadings([]);
    setReadingsError(null);
    setReadingsLoading(false);
  }, [selectedPoint]);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await locationsApi.getAll({ limit: 500, offset: 0 });
        if (!canceled && res?.success) setLocations(res.data ?? []);
      } catch (e: unknown) {
        if (!canceled)
          setError(e instanceof Error ? e.message : 'Failed to load locations');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, good: 0 };
    for (const p of allPoints) c[p.status as keyof typeof c] += 1;
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
        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredPoints.map((point) => {
              const isSelected = selectedPoint === point.id;
              const color =
                point.status === 'critical'
                  ? '#ef4444'
                  : point.status === 'warning'
                    ? '#f59e0b'
                    : '#22c55e';

              return (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={isSelected ? 12 : 9}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedPoint(point.id),
                  }}
                />
              );
            })}
          </MapContainer>

          {(loading || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/80 to-green-50/80 dark:from-blue-950/40 dark:to-green-950/40 z-[900]">
              <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl px-6 py-5 border border-gray-200/60 dark:border-gray-700/60 shadow-xl">
                {loading && (
                  <>
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Loading map data…
                    </div>
                  </>
                )}
                {!loading && error && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Filter Panel */}
          <div className="absolute top-6 left-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[1000] transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Status
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Locations ({loading ? '…' : locations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('critical')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'critical'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Critical ({loading ? '…' : counts.critical})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('warning')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'warning'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Warning ({loading ? '…' : counts.warning})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('good')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'good'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Good ({loading ? '…' : counts.good})
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[1000] transition-colors duration-200">
            <div className="text-xs font-semibold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Legend
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Good Quality
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    All parameters normal
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Warning
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Minor issues detected
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Critical
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Immediate action needed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="absolute bottom-6 right-6 text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-lg z-[1000] shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-200">
            © OpenStreetMap contributors
          </div>
        </div>

        {/* Right Panel - Location Details */}
        {selectedData && (
          <div className="w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedData.name}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedData.state}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSelectedPoint(null)}
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusBgColors[selectedData.status as keyof typeof statusBgColors]} text-white shadow-lg`}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {
                    statusLabels[
                      selectedData.status as keyof typeof statusLabels
                    ]
                  }
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Primary Issue
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-sm text-red-900 dark:text-red-300 font-medium">
                      {(selectedData.active_alerts ?? 0) > 0
                        ? `${selectedData.active_alerts} active alert(s)`
                        : `Risk status: ${statusLabels[selectedData.status as keyof typeof statusLabels]}`}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Water Parameters
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          WQI Score
                        </span>
                      </div>
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {selectedData.derived_wqi_score !== null &&
                        selectedData.derived_wqi_score !== undefined
                          ? Number(selectedData.derived_wqi_score).toFixed(1)
                          : selectedData.avg_wqi_score !== null &&
                              selectedData.avg_wqi_score !== undefined
                            ? Number(selectedData.avg_wqi_score).toFixed(1)
                            : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                          Active Alerts
                        </span>
                      </div>
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {selectedData.active_alerts ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Location Details
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Latitude
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedData.lat.toFixed(4)}°
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Longitude
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedData.lng.toFixed(4)}°
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedData.last_reading
                          ? new Date(selectedData.last_reading).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedData) return;
                      setShowReadings(true);
                      setReadingsLoading(true);
                      setReadingsError(null);
                      try {
                        const res = await waterQualityApi.getAllReadings({
                          location_id: selectedData.id,
                        });
                        setReadings(res?.data ?? []);
                      } catch (e: unknown) {
                        setReadingsError(
                          e instanceof Error
                            ? e.message
                            : 'Failed to load readings'
                        );
                        setReadings([]);
                      } finally {
                        setReadingsLoading(false);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium"
                  >
                    View Full Analytics
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                  >
                    Download Data
                  </button>
                </div>

                {showReadings && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        All Readings
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReadings(false)}
                        className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>

                    {readingsLoading && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Loading readings…
                      </div>
                    )}

                    {!readingsLoading && readingsError && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {readingsError}
                      </div>
                    )}

                    {!readingsLoading && !readingsError && (
                      <div className="max-h-[260px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                              <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                Date
                              </th>
                              <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                Param
                              </th>
                              <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                Value
                              </th>
                              <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                                Risk
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {readings.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-3 py-3 text-gray-600 dark:text-gray-300"
                                >
                                  No readings found.
                                </td>
                              </tr>
                            ) : (
                              readings.map((r) => (
                                <tr
                                  key={r.id}
                                  className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                >
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    {new Date(
                                      r.measurement_date
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                    {r.parameter_code}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    {Number(r.value).toFixed(2)} {r.unit || ''}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                    {r.risk_level || 'n/a'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
