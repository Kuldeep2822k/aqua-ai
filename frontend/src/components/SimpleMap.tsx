import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';
import { usePerformanceOptimizer } from '../hooks/usePerformanceOptimizer';
import { useQuery } from '@tanstack/react-query';
import { locationsApi, calculateRiskLevel } from '../services/waterQualityApi';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface SimpleMapProps {
  height?: string | number;
}

// Location data type for map markers
interface LocationData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  value: string;
  state: string;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ height = '400px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Critical');
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Use performance optimizer hook
  const { batchDOMReads, batchDOMWrites, createDebouncedResizeHandler } =
    usePerformanceOptimizer();

  // Fetch locations from API using React Query
  const {
    data: locationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['locations-geojson'],
    queryFn: async () => locationsApi.getGeoJSON(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Transform API data to LocationData format
  const locationData: LocationData[] = useMemo(() => {
    if (!locationsResponse?.data?.features) return [];
    return locationsResponse.data.features.map((feature, index) => ({
      id: feature.properties.id || index + 1,
      name: feature.properties.name,
      lat: feature.geometry.coordinates[1], // GeoJSON is [lng, lat]
      lng: feature.geometry.coordinates[0],
      risk: calculateRiskLevel(feature.properties.avg_wqi_score),
      value: `WQI: ${feature.properties.avg_wqi_score?.toFixed(1) || 'N/A'}`,
      state: feature.properties.state,
    }));
  }, [locationsResponse]);

  // Parameter categories - each shows 3-4 key parameters per state
  const parameterCategories = {
    Critical: ['BOD', 'Heavy Metals', 'Industrial', 'Coliform'],
    Basic: ['pH', 'DO', 'TDS', 'Turbidity'],
    Chemical: ['Nitrates', 'Ammonia', 'Fluoride', 'Pesticides'],
    Environmental: ['Arsenic', 'Salinity', 'Coal', 'Iron'],
  };

  // Memoized filter function to prevent unnecessary recalculations
  const getFilteredData = useCallback(() => {
    // If no data from API, return empty array
    if (locationData.length === 0) return [];

    const categoryParams =
      parameterCategories[selectedCategory as keyof typeof parameterCategories];

    // Filter by risk level based on category
    // Critical = critical/high risk, Basic = all, Chemical = medium/high, Environmental = any
    if (selectedCategory === 'Critical') {
      return locationData.filter(
        (location: LocationData) =>
          location.risk === 'critical' || location.risk === 'high'
      );
    } else if (selectedCategory === 'Basic') {
      return locationData; // Show all locations
    } else if (selectedCategory === 'Chemical') {
      return locationData.filter(
        (location: LocationData) =>
          location.risk === 'medium' || location.risk === 'high'
      );
    } else {
      // Environmental - show all
      return locationData;
    }
  }, [selectedCategory, locationData]);

  // Optimized marker management
  const clearMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      batchDOMWrites([
        () => {
          markersRef.current.forEach((marker) => {
            if (mapInstance.current) {
              mapInstance.current.removeLayer(marker);
            }
          });
          markersRef.current = [];
        },
      ]);
    }
  }, [batchDOMWrites]);

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'high':
        return '#e74c3c';
      case 'critical':
        return '#8e44ad';
      default:
        return '#95a5a6';
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers first
    clearMarkers();

    try {
      // Initialize map if not already created
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          center: [23.5937, 78.9629], // Center of India (slightly adjusted)
          zoom: 5,
          minZoom: 4,
          maxZoom: 12,
          zoomControl: true,
          // Restrict panning to India region
          maxBounds: [
            [6.0, 68.0], // Southwest corner (southernmost and westernmost points of India)
            [37.0, 98.0], // Northeast corner (northernmost and easternmost points of India)
          ],
          maxBoundsViscosity: 0.8, // Makes it harder to pan outside bounds
          preferCanvas: true, // Use canvas for better performance
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstance.current);
      }

      // Batch marker creation for better performance
      const filteredData = getFilteredData();

      batchDOMWrites([
        () => {
          filteredData.forEach((location) => {
            const color = getRiskColor(location.risk);

            const marker = L.circleMarker([location.lat, location.lng], {
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              radius: 10,
              weight: 2,
            });

            const popupContent = `
              <div style="font-family: Arial, sans-serif; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: bold;">${location.name}</h3>
                <p style="margin: 0 0 8px 0; color: #7f8c8d; font-size: 13px;">
                  <strong>📍 ${location.state}</strong>
                </p>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: bold; color: #34495e;">${location.value}</span>
                </div>
                <span style="
                  background: ${color}; 
                  color: white; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
                  font-size: 12px;
                  text-transform: capitalize;
                  font-weight: bold;
                  display: inline-block;
                ">
                  🚨 ${location.risk} Risk
                </span>
              </div>
            `;

            marker.bindPopup(popupContent);
            if (mapInstance.current) {
              marker.addTo(mapInstance.current);
              markersRef.current.push(marker);
            }
          });
        },
      ]);

      // Use requestAnimationFrame to prevent forced reflows
      requestAnimationFrame(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize({ animate: false });
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup
    return () => {
      clearMarkers();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [selectedCategory, getFilteredData, clearMarkers, batchDOMWrites]); // Re-render when category selection changes

  return (
    <Box sx={{ position: 'relative', height: height }}>
      {/* Parameter Category Selection */}
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
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}
        >
          Select Parameter Category:
        </Typography>
        <ButtonGroup size="small" variant="contained">
          {Object.keys(parameterCategories).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              sx={{ fontSize: '10px', minWidth: '60px' }}
            >
              {category}
            </Button>
          ))}
        </ButtonGroup>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 1, fontSize: '9px' }}
        >
          Showing:{' '}
          {parameterCategories[
            selectedCategory as keyof typeof parameterCategories
          ].join(', ')}
        </Typography>
      </Box>

      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          contain: 'layout style paint',
          willChange: 'auto',
        }}
        className="critical-content"
        data-testid="map-container"
      />

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'white',
          padding: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
          minWidth: '120px',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}
        >
          Risk Levels
        </Typography>
        {[
          { level: 'low', color: '#27ae60', label: 'Low' },
          { level: 'medium', color: '#f39c12', label: 'Medium' },
          { level: 'high', color: '#e74c3c', label: 'High' },
          { level: 'critical', color: '#8e44ad', label: 'Critical' },
        ].map(({ level, color, label }) => (
          <Box
            key={level}
            sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color,
                mr: 1,
              }}
            />
            <Typography variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Data count */}
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
          {getFilteredData().length} locations ({selectedCategory})
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleMap;
