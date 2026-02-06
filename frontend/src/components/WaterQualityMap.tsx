import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import api from '../services/api';
import LocationDetails from './LocationDetails';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface WaterQualityLocation {
  id: number;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  type: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  wqiScore?: number;
}

const StyledMapContainer = styled.div`
  height: 600px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 250px;
`;

const FilterButton = styled.button<{ active: boolean }>`
  background: ${(props) => (props.active ? '#3498db' : 'white')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: 1px solid #3498db;
  padding: 8px 12px;
  margin: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: ${(props) => (props.active ? '#2980b9' : '#f8f9fa')};
  }
`;

const PopupContent = styled.div`
  max-width: 300px;

  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
  }

  .location-info {
    margin-bottom: 15px;
    font-size: 14px;
    color: #7f8c8d;
  }

  .wqi-score {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .score {
      font-size: 24px;
      font-weight: bold;
      margin-right: 10px;
    }

    .grade {
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
    }
  }

  .parameters {
    display: grid;
    gap: 8px;
  }

  .parameter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: #f8f9fa;
    border-radius: 4px;

    .name {
      font-weight: 500;
    }

    .value {
      display: flex;
      align-items: center;
      gap: 8px;

      .number {
        font-weight: bold;
      }

      .status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
    }
  }
`;

const Legend = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #2c3e50;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;

    .color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .label {
      font-size: 12px;
      color: #555;
    }
  }
`;

const WaterQualityMap: React.FC = () => {
  const [locations, setLocations] = useState<WaterQualityLocation[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(0);

  // India center coordinates
  const indiaCenter: LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    fetchLocations();
  }, [selectedParameter]); // Refetch when parameter changes

  // Force map refresh when data changes
  useEffect(() => {
    if (!loading && locations.length > 0) {
      setMapKey((prev) => prev + 1);
    }
  }, [locations, loading]);

  const fetchLocations = async () => {
    try {
      setLoading(true);

      let endpoint = '/locations';
      let params = {};

      // If a specific parameter is selected, we need to filter locations by that parameter.
      // Since the locations endpoint doesn't support parameter filtering,
      // we use the water-quality endpoint which returns readings filtered by parameter,
      // and then extract the unique locations.
      if (selectedParameter !== 'all') {
        endpoint = '/water-quality';
        params = { parameter: selectedParameter, limit: 1000 }; // Ensure we get enough data
      }

      const response = await api.get(endpoint, { params });

      if (response.data && response.data.data) {
        let mappedLocations: WaterQualityLocation[] = [];

        if (endpoint === '/locations') {
          mappedLocations = response.data.data.map((loc: any) => {
            const rawScore = loc.avg_wqi_score ?? loc.derived_wqi_score ?? null;
            const wqiScore =
              rawScore === null || rawScore === undefined
                ? undefined
                : Math.round(Number(rawScore));
            const riskFromScore =
              rawScore === null || rawScore === undefined
                ? 'unknown'
                : Number(rawScore) >= 80
                  ? 'low'
                  : Number(rawScore) >= 60
                    ? 'medium'
                    : Number(rawScore) >= 40
                      ? 'high'
                      : 'critical';

            return {
              id: loc.id,
              name: loc.name,
              state: loc.state,
              district: loc.district,
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude),
              type: loc.water_body_type || 'river',
              wqiScore,
              riskLevel: loc.derived_risk_level || riskFromScore,
            };
          });
        } else {
          // Handle response from /water-quality endpoint which returns readings
          // We need to deduplicate locations by ID
          const uniqueLocations = new Map();

          response.data.data.forEach((item: any) => {
            const locId = item.location_id;
            if (!uniqueLocations.has(locId)) {
              uniqueLocations.set(locId, {
                id: locId,
                name: item.location_name,
                state: item.state,
                district: item.district,
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
                type: item.water_body_type || 'river',
                wqiScore: item.quality_score,
                riskLevel: item.risk_level,
              });
            }
          });
          mappedLocations = Array.from(uniqueLocations.values());
        }

        setLocations(mappedLocations);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError('Failed to fetch water quality data');
      setLoading(false);
    }
  };

  const getMarkerColor = (riskLevel?: string): string => {
    switch (riskLevel) {
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

  const getWQIGrade = (score?: number): { grade: string; color: string } => {
    if (score === undefined || score === null || Number.isNaN(score)) {
      return { grade: 'Unknown', color: '#95a5a6' };
    }

    if (score >= 80) return { grade: 'Excellent', color: '#27ae60' };
    if (score >= 60) return { grade: 'Good', color: '#2ecc71' };
    if (score >= 40) return { grade: 'Fair', color: '#f39c12' };
    if (score >= 20) return { grade: 'Poor', color: '#e74c3c' };
    return { grade: 'Very Poor', color: '#8e44ad' };
  };

  const filteredLocations = locations.filter((location) => {
    if (
      selectedRiskLevel !== 'all' &&
      location.riskLevel !== selectedRiskLevel
    ) {
      return false;
    }

    return true;
  });

  const parameters = [
    'BOD',
    'TDS',
    'pH',
    'DO',
    'Lead',
    'Mercury',
    'Coliform',
    'Nitrates',
  ];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '16px',
        }}
      >
        Loading water quality data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '16px',
          color: '#e74c3c',
        }}
      >
        <div>Error loading map: {error}</div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchLocations();
          }}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <StyledMapContainer>
        <MapContainer
          key={mapKey}
          center={indiaCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {filteredLocations.map((location) => (
            <CircleMarker
              key={location.id}
              center={[location.latitude, location.longitude]}
              radius={10}
              pathOptions={{
                color: getMarkerColor(location.riskLevel),
                fillColor: getMarkerColor(location.riskLevel),
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <PopupContent>
                  <h3>{location.name}</h3>
                  <div className="location-info">
                    {location.district}, {location.state} | {location.type}
                  </div>

                  {location.wqiScore !== undefined &&
                    location.wqiScore !== null && (
                    <div className="wqi-score">
                      <span className="score">{location.wqiScore}</span>
                      <span
                        className="grade"
                        style={{
                          backgroundColor: getWQIGrade(location.wqiScore).color,
                        }}
                      >
                        {getWQIGrade(location.wqiScore).grade}
                      </span>
                    </div>
                  )}

                  <LocationDetails
                    locationId={location.id}
                    parameter={selectedParameter}
                  />
                </PopupContent>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </StyledMapContainer>

      <ControlPanel>
        <h4>Filters</h4>

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px',
              display: 'block',
            }}
          >
            Parameter:
          </label>
          <FilterButton
            active={selectedParameter === 'all'}
            onClick={() => setSelectedParameter('all')}
          >
            All
          </FilterButton>
          {parameters.map((param) => (
            <FilterButton
              key={param}
              active={selectedParameter === param}
              onClick={() => setSelectedParameter(param)}
            >
              {param}
            </FilterButton>
          ))}
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px',
              display: 'block',
            }}
          >
            Risk Level:
          </label>
          <FilterButton
            active={selectedRiskLevel === 'all'}
            onClick={() => setSelectedRiskLevel('all')}
          >
            All
          </FilterButton>
          {riskLevels.map((level) => (
            <FilterButton
              key={level}
              active={selectedRiskLevel === level}
              onClick={() => setSelectedRiskLevel(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </FilterButton>
          ))}
        </div>

        <div style={{ marginTop: '15px', fontSize: '11px', color: '#666' }}>
          Showing {filteredLocations.length} of {locations.length} locations
        </div>
      </ControlPanel>

      <Legend>
        <h4>Risk Levels</h4>
        <div className="legend-item">
          <div className="color" style={{ backgroundColor: '#27ae60' }} />
          <span className="label">Low Risk</span>
        </div>
        <div className="legend-item">
          <div className="color" style={{ backgroundColor: '#f39c12' }} />
          <span className="label">Medium Risk</span>
        </div>
        <div className="legend-item">
          <div className="color" style={{ backgroundColor: '#e74c3c' }} />
          <span className="label">High Risk</span>
        </div>
        <div className="legend-item">
          <div className="color" style={{ backgroundColor: '#8e44ad' }} />
          <span className="label">Critical Risk</span>
        </div>
      </Legend>
    </div>
  );
};

export default WaterQualityMap;
