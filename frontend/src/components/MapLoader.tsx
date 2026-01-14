import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import LoadingSpinner from './common/LoadingSpinner';

// Dynamically import map components to reduce main bundle size
const SimpleMap = lazy(() =>
  import(/* webpackChunkName: "simple-map" */ './SimpleMap')
);

const DashboardMap = lazy(() =>
  import(/* webpackChunkName: "dashboard-map" */ './DashboardMap')
);

const WaterQualityMap = lazy(() =>
  import(/* webpackChunkName: "water-quality-map" */ './WaterQualityMap')
);

interface MapLoaderProps {
  type: 'simple' | 'dashboard' | 'waterQuality';
  height?: string | number;
  [key: string]: any;
}

// Custom loading component for maps
const MapLoadingSpinner: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      backgroundColor: '#f8f9fa',
      borderRadius: 1,
      border: '1px solid #e9ecef'
    }}
  >
    <CircularProgress size={40} thickness={4} />
    <Typography variant="body2" sx={{ mt: 2, color: 'text.primary', fontWeight: 500 }}>
      Loading interactive map...
    </Typography>
  </Box>
);

const MapLoader: React.FC<MapLoaderProps> = ({ type, height, ...otherProps }) => {
  const getMapComponent = () => {
    switch (type) {
      case 'dashboard':
        // DashboardMap might accept different props
        return <DashboardMap height={height} {...otherProps} />;
      case 'waterQuality':
        // WaterQualityMap doesn't accept props, just render it
        return <WaterQualityMap />;
      case 'simple':
      default:
        return <SimpleMap height={height} {...otherProps} />;
    }
  };

  return (
    <Suspense fallback={<MapLoadingSpinner />}>
      <div className="optimize-paint batch-layout">
        {getMapComponent()}
      </div>
    </Suspense>
  );
};

export default MapLoader;
