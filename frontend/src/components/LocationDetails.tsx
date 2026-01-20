import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

interface LocationDetailsProps {
  locationId: number;
}

interface WaterQualityReading {
  parameter: string;
  value: number;
  unit: string;
  date: string;
  safeLimit: number;
  exceedsLimit: boolean;
  riskLevel: string;
  parameter_code: string;
}

const DetailsContainer = styled.div`
  min-width: 200px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #7f8c8d;
`;

const ParameterItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;

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
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 10px;
  text-align: center;
`;

const LocationDetails: React.FC<LocationDetailsProps> = ({ locationId }) => {
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        // Using the endpoint that gets readings for a specific location
        const response = await api.get(`/water-quality/location/${locationId}`);

        if (response.data && response.data.data) {
          const mappedReadings = response.data.data.map((item: any) => ({
            parameter: item.parameter,
            parameter_code: item.parameter_code,
            value: parseFloat(item.value),
            unit: item.unit,
            date: item.measurement_date,
            // Assuming the backend might not return 'exceedsLimit', we calculate it or use risk_level
            exceedsLimit:
              item.risk_level === 'high' || item.risk_level === 'critical',
            riskLevel: item.risk_level,
          }));
          setReadings(mappedReadings);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching location details:', err);
        setError('Failed to load details');
        setLoading(false);
      }
    };

    fetchReadings();
  }, [locationId]);

  if (loading) {
    return <LoadingSpinner>Loading data...</LoadingSpinner>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (readings.length === 0) {
    return (
      <div style={{ padding: '10px', textAlign: 'center', color: '#7f8c8d' }}>
        No recent data available
      </div>
    );
  }

  return (
    <DetailsContainer>
      {readings.map((reading, index) => (
        <ParameterItem key={index}>
          <span className="name">{reading.parameter}</span>
          <div className="value">
            <span className="number">
              {reading.value.toFixed(2)} {reading.unit}
            </span>
            <div
              className="status"
              style={{
                backgroundColor: reading.exceedsLimit ? '#e74c3c' : '#27ae60',
              }}
              title={
                reading.exceedsLimit ? 'Concerns detected' : 'Within limits'
              }
            />
          </div>
        </ParameterItem>
      ))}
    </DetailsContainer>
  );
};

export default LocationDetails;
