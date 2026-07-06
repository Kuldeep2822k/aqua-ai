import { Filter } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { type Location } from '../../services/api';
import { type MapPoint } from './types';

interface WaterQualityMapProps {
  filteredPoints: MapPoint[];
  selectedPoint: number | null;
  setSelectedPoint: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  locations: Location[];
  counts: { critical: number; warning: number; good: number };
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export function WaterQualityMap({
  filteredPoints,
  selectedPoint,
  setSelectedPoint,
  loading,
  error,
  locations,
  counts,
  filterStatus,
  setFilterStatus,
}: WaterQualityMapProps) {
  return (
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
  );
}
