import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Image as ImageIcon } from 'lucide-react';
import { locationsApi, type Location } from '../services/api';

// Fix default marker icons
const leafletIconProto = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: unknown;
};
delete leafletIconProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom colored markers
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const criticalIcon = createColoredIcon('#ef4444');
const warningIcon = createColoredIcon('#f59e0b');
const goodIcon = createColoredIcon('#22c55e');

function getRiskLevel(wqiScore: number | null): 'critical' | 'warning' | 'good' {
  if (!wqiScore || wqiScore < 40) return 'critical';
  if (wqiScore < 70) return 'warning';
  return 'good';
}

function getMarkerIcon(riskLevel: 'critical' | 'warning' | 'good') {
  switch (riskLevel) {
    case 'critical': return criticalIcon;
    case 'warning': return warningIcon;
    case 'good': return goodIcon;
  }
}

// Component to fit bounds
function FitBoundsToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

export function MapView() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationsApi.getAll({ limit: 100 });
        if (response.success) {
          setLocations(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError('Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Count by risk level
  const riskCounts = locations.reduce(
    (acc, loc) => {
      const risk = getRiskLevel(loc.avg_wqi_score);
      acc[risk]++;
      return acc;
    },
    { good: 0, warning: 0, critical: 0 }
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Water Quality Map - India</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors duration-200">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors duration-200">
            <ImageIcon className="w-4 h-4" />
            Export Map
          </button>
        </div>
      </div>

      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading map...</div>
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
              const riskLevel = getRiskLevel(location.avg_wqi_score);
              return (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={getMarkerIcon(riskLevel)}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.district}, {location.state}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Water Body:</span>
                          <span className="font-medium capitalize">{location.water_body_type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>WQI Score:</span>
                          <span className="font-medium">{location.avg_wqi_score?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className={`font-medium ${riskLevel === 'critical' ? 'text-red-600' :
                              riskLevel === 'warning' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                          </span>
                        </div>
                        {location.active_alerts > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Active Alerts:</span>
                            <span className="font-medium text-red-600">{location.active_alerts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg z-[1000] border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Water Quality Status</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Good ({riskCounts.good})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Warning ({riskCounts.warning})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Critical ({riskCounts.critical})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
