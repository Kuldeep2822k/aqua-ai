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
    <section className="journal-map" aria-label="Water quality map">
      <div className="journal-map-caption">
        <span>Water network / India</span>
        <span>{locations.length} stations</span>
      </div>
      <div className="relative h-[320px] w-full overflow-hidden border border-[#7ea6a5]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#d4e6e3]">
            <div className="text-sm text-[#476664]">Loading map...</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#d4e6e3]">
            <div className="text-sm text-[#b33d26]">{error}</div>
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
        <div className="journal-map-legend z-[1000]">
          <span><i className="journal-dot-stable" />Low ({riskCounts.low})</span>
          <span><i className="journal-dot-watch" />Medium ({riskCounts.medium})</span>
          <span><i className="journal-dot-critical" />High ({riskCounts.high + riskCounts.critical})</span>
        </div>
      </div>
    </section>
  );
}
