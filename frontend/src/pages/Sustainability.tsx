import React from 'react';
import { Container, Typography, Grid, Paper, Card, CardContent, Box, Button } from '@mui/material';
import { Nature, Recycling, ElectricBolt } from '@mui/icons-material';

const Sustainability: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sustainability Initiatives
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Nature sx={{ mr: 1 }} />
                <Typography variant="h6">Ecosystems Protected</Typography>
              </Box>
              <Typography variant="h4" color="primary">23</Typography>
              <Typography color="textSecondary">Water bodies monitored</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Recycling sx={{ mr: 1 }} />
                <Typography variant="h6">Waste Reduced</Typography>
              </Box>
              <Typography variant="h4" color="primary">85%</Typography>
              <Typography color="textSecondary">Through digital reporting</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ElectricBolt sx={{ mr: 1 }} />
                <Typography variant="h6">Carbon Footprint</Typography>
              </Box>
              <Typography variant="h4" color="success.main">-42%</Typography>
              <Typography color="textSecondary">Reduction since 2020</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Environmental Impact
            </Typography>
            <Typography color="textSecondary" paragraph>
              Our platform contributes to environmental sustainability by enabling
              efficient water quality monitoring, reducing the need for physical
              site visits, and providing early warning systems for contamination events.
            </Typography>
            <Typography color="textSecondary" paragraph>
              By digitizing data collection and analysis, we help reduce paper waste
              and improve the speed and accuracy of environmental assessments.
            </Typography>
            <Button variant="contained" sx={{ mr: 2 }}>
              View Impact Report
            </Button>
            <Button variant="outlined">
              Join Initiative
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Sustainability;