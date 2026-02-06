import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import WaterQualityMap from '../components/WaterQualityMap';

const MapView: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Water Quality Map
        </Typography>
        <Typography variant="body1" color="text.primary">
          Data shown is loaded from live API responses.
        </Typography>
      </Box>
      <WaterQualityMap />
    </Container>
  );
};

export default MapView;
