import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { mapService, LocationData, WaterQualityReading } from '../services/api';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapContainer_Styled = styled.div`
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
  background: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid #3498db;
  padding: 8px 12px;
  margin: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: ${props => props.active ? '#2980b9' : '#f8f9fa'};
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
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(0);

  // India center coordinates
  const indiaCenter: LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    fetchLocations();
  }, []);
  
  // Force map refresh when data changes
  useEffect(() => {
    if (!loading && locations.length > 0) {
      setMapKey(prev => prev + 1);
    }
  }, [locations, loading]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const apiLocations = await mapService.getLocationsWithData();

      setLocations(apiLocations);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch water quality data');
      setLoading(false);
    }
  };

  const getMarkerColor = (riskLevel?: string): string => {
    switch (riskLevel) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      case 'critical': return '#8e44ad';
      default: return '#95a5a6';
    }
  };

  const getWQIGrade = (score?: number): { grade: string; color: string } => {
    if (!score) return { grade: 'Unknown', color: '#95a5a6' };
    
    if (score >= 80) return { grade: 'Excellent', color: '#27ae60' };
    if (score >= 60) return { grade: 'Good', color: '#2ecc71' };
    if (score >= 40) return { grade: 'Fair', color: '#f39c12' };
    if (score >= 20) return { grade: 'Poor', color: '#e74c3c' };
    return { grade: 'Very Poor', color: '#8e44ad' };
  };

  const filteredLocations = locations.filter(location => {
    if (selectedRiskLevel !== 'all' && location.riskLevel !== selectedRiskLevel) {
      return false;
    }
    
    if (selectedParameter !== 'all') {
      return location.currentData?.some(reading => reading.parameter === selectedParameter);
    }
    
    return true;
  });

  const parameters = ['BOD', 'TDS', 'pH', 'DO', 'Lead', 'Mercury', 'Coliform', 'Nitrates'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px'
      }}>
        Loading water quality data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#e74c3c'
      }}>
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
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer_Styled>
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
          
          {filteredLocations.map(location => (
            <CircleMarker
              key={location.id}
              center={[location.latitude, location.longitude]}
              radius={10}
              pathOptions={{
                color: getMarkerColor(location.riskLevel),
                fillColor: getMarkerColor(location.riskLevel),
                fillOpacity: 0.7,
                weight: 2
              }}
            >
              <Popup>
                <PopupContent>
                  <h3>{location.name}</h3>
                  <div className="location-info">
                    {location.district}, {location.state} | {location.type}
                  </div>
                  
                  {location.wqiScore && (
                    <div className="wqi-score">
                      <span className="score">{location.wqiScore}</span>
                      <span 
                        className="grade"
                        style={{ backgroundColor: getWQIGrade(location.wqiScore).color }}
                      >
                        {getWQIGrade(location.wqiScore).grade}
                      </span>
                    </div>
                  )}
                  
                  <div className="parameters">
                    {location.currentData?.map((reading, index) => (
                      <div key={index} className="parameter">
                        <span className="name">{reading.parameter}</span>
                        <div className="value">
                          <span className="number">
                            {reading.value.toFixed(2)} {reading.unit}
                          </span>
                          <div 
                            className="status"
                            style={{
                              backgroundColor: reading.exceedsLimit ? '#e74c3c' : '#27ae60'
                            }}
                            title={reading.exceedsLimit ? 'Exceeds safe limit' : 'Within safe limit'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </PopupContent>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </MapContainer_Styled>

      <ControlPanel>
        <h4>Filters</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
            Parameter:
          </label>
          <FilterButton 
            active={selectedParameter === 'all'}
            onClick={() => setSelectedParameter('all')}
          >
            All
          </FilterButton>
          {parameters.map(param => (
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
          <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
            Risk Level:
          </label>
          <FilterButton 
            active={selectedRiskLevel === 'all'}
            onClick={() => setSelectedRiskLevel('all')}
          >
            All
          </FilterButton>
          {riskLevels.map(level => (
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
