import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button, ButtonGroup } from '@mui/material';
import api from '../services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface SimpleMapProps {
  height?: string | number;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

interface LocationProperties {
  id: number;
  name: string;
  state: string;
  district: string | null;
  water_body_type: string | null;
  water_body_name: string | null;
  population_affected: number | null;
  avg_wqi_score: number | null;
  derived_wqi_score?: number | null;
  derived_wqi_category?: string | null;
  derived_risk_level?: RiskLevel | null;
  active_alerts: number | null;
  last_reading: string | null;
}

interface LocationFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: LocationProperties;
}

interface LocationsGeoJson {
  type: 'FeatureCollection';
  features: LocationFeature[];
}

const riskColors: Record<RiskLevel, string> = {
  low: '#27ae60',
  medium: '#f39c12',
  high: '#e74c3c',
  critical: '#8e44ad',
  unknown: '#607d8b',
};

function scoreToRiskLevel(score: number | null): RiskLevel {
  if (score === null || Number.isNaN(score)) return 'unknown';
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function getPreferredScore(p: LocationProperties): number | null {
  if (p.derived_wqi_score !== undefined && p.derived_wqi_score !== null) {
    return Number(p.derived_wqi_score);
  }
  return p.avg_wqi_score;
}

function getPreferredRisk(p: LocationProperties): RiskLevel {
  if (p.derived_risk_level && p.derived_risk_level !== 'unknown') {
    return p.derived_risk_level;
  }
  return scoreToRiskLevel(getPreferredScore(p));
}

const SimpleMap: React.FC<SimpleMapProps> = ({ height = '400px' }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<RiskLevel | 'all'>(
    'all'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojson, setGeojson] = useState<LocationsGeoJson | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/locations/geojson');
        const payload = res.data?.data as LocationsGeoJson | undefined;
        if (!payload?.features) throw new Error('Invalid GeoJSON payload');
        if (!canceled) setGeojson(payload);
      } catch (e: any) {
        if (!canceled) setError(e?.message || 'Failed to load map data');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    const features = geojson?.features ?? [];
    if (selectedCategory === 'all') return features;
    return features.filter(
      (f) => getPreferredRisk(f.properties) === selectedCategory
    );
  }, [geojson, selectedCategory]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.9734, 78.6569],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersRef.current) return;

    markersRef.current.clearLayers();

    for (const feature of filteredFeatures) {
      const [lng, lat] = feature.geometry.coordinates;
      const risk = getPreferredRisk(feature.properties);
      const color = riskColors[risk];

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.75,
        weight: 2,
      });

      const alertsCount = feature.properties.active_alerts ?? 0;
      const wqi = getPreferredScore(feature.properties);
      const category = feature.properties.derived_wqi_category ?? null;

      marker.bindPopup(
        `<div style="min-width: 220px;">
          <div style="font-weight: 700; margin-bottom: 6px;">${feature.properties.name}</div>
          <div style="margin-bottom: 6px;">${feature.properties.state}${
          feature.properties.district ? ` • ${feature.properties.district}` : ''
        }</div>
          <div style="margin-bottom: 6px;">WQI: ${
            wqi === null ? 'N/A' : Number(wqi).toFixed(2)
          } (${(category || risk).toString().toUpperCase()})</div>
          <div>Active alerts: ${alertsCount}</div>
        </div>`
      );

      marker.addTo(markersRef.current);
    }
  }, [filteredFeatures]);

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'white',
          padding: 1,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
          minWidth: 220,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
          Risk Filter
        </Typography>
        <ButtonGroup size="small" sx={{ mt: 1, flexWrap: 'wrap' }}>
          <Button
            variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {(['low', 'medium', 'high', 'critical', 'unknown'] as RiskLevel[]).map(
            (lvl) => (
              <Button
                key={lvl}
                variant={selectedCategory === lvl ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(lvl)}
              >
                {lvl}
              </Button>
            )
          )}
        </ButtonGroup>
        {loading && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Loading map data…
          </Typography>
        )}
        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'block', mt: 1 }}
          >
            {error}
          </Typography>
        )}
      </Box>

      <Box
        ref={mapContainerRef}
        sx={{ height: '100%', width: '100%', borderRadius: 1, overflow: 'hidden' }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'white',
          padding: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
          minWidth: 140,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
          Risk Levels
        </Typography>
        {(Object.keys(riskColors) as RiskLevel[]).map((level) => (
          <Box
            key={level}
            sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: riskColors[level],
                mr: 1,
              }}
            />
            <Typography variant="caption">{level}</Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'white',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
          zIndex: 1000,
        }}
      >
        <Typography variant="caption">
          {filteredFeatures.length} locations ({selectedCategory})
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleMap;
