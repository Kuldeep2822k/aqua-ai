import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Location } from '../services/api';
import { useLocations } from '../hooks/useLocations';
import { getRiskLevel, getMarkerIcon } from '../utils/map';
import { LocationPopup } from './LocationPopup';

// Fix default marker icons
const leafletIconProto = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: unknown;
};
delete leafletIconProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// Component to fit bounds
function FitBoundsToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(
          (loc) => [loc.latitude, loc.longitude] as [number, number]
        )
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

export function MapView() {
  const { locations, loading, error } = useLocations();

  // ⚡ Bolt: Wrap riskCounts in useMemo to prevent O(N) recalculation on every re-render
  // Count by risk level
  const riskCounts = useMemo(() => {
    return locations.reduce(
      (acc, loc) => {
        const risk = getRiskLevel(loc.avg_wqi_score ?? 0);
        acc[risk]++;
        return acc;
      },
      { low: 0, medium: 0, high: 0, critical: 0 }
    );
  }, [locations]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Water Quality Map - India
        </h2>
      </div>

      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading map...
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBoundsToLocations locations={locations} />

            {locations.map((location) => {
              return (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={getMarkerIcon(location.avg_wqi_score ?? 0)}
                >
                  <Popup>
                    <LocationPopup location={location} />
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg z-[1000] border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
            Water Quality Status
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Low Risk ({riskCounts.low})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Medium Risk ({riskCounts.medium})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                High Risk ({riskCounts.high})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Critical ({riskCounts.critical})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
