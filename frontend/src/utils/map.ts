import L from 'leaflet';

export function getRiskLevel(
  wqi: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (wqi >= 80) {
    return 'low';
  }
  if (wqi >= 60) {
    return 'medium';
  }
  if (wqi >= 40) {
    return 'high';
  }
  return 'critical';
}

export function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export function getMarkerIcon(wqi: number): L.DivIcon {
  const level = getRiskLevel(wqi);
  const colors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };
  return createColoredIcon(colors[level]);
}
