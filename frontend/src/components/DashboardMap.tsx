import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import SimpleMap from './SimpleMap';

interface DashboardMapProps {
  height?: string | number;
}

const DashboardMap: React.FC<DashboardMapProps> = ({ height = '400px' }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Water Quality Map
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click on markers to view detailed water quality data
          </Typography>
        </Box>
        <Box sx={{ height: height, position: 'relative' }}>
          <SimpleMap height={height} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardMap;