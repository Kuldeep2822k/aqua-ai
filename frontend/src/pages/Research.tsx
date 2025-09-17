import React from 'react';
import { Container, Typography, Grid, Paper, Card, CardContent, Box, Button } from '@mui/material';
import { Science, Article, DataUsage } from '@mui/icons-material';

const Research: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Research & Development
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Science sx={{ mr: 1 }} />
                <Typography variant="h6">Active Studies</Typography>
              </Box>
              <Typography variant="h4" color="primary">12</Typography>
              <Typography color="textSecondary">Ongoing research projects</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Article sx={{ mr: 1 }} />
                <Typography variant="h6">Publications</Typography>
              </Box>
              <Typography variant="h4" color="primary">45</Typography>
              <Typography color="textSecondary">Research papers published</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DataUsage sx={{ mr: 1 }} />
                <Typography variant="h6">Data Sets</Typography>
              </Box>
              <Typography variant="h4" color="primary">234</Typography>
              <Typography color="textSecondary">Available for analysis</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Latest Research Findings
            </Typography>
            <Typography color="textSecondary" paragraph>
              Our research team continuously analyzes water quality data to identify trends,
              predict contamination events, and develop better monitoring techniques.
            </Typography>
            <Typography color="textSecondary" paragraph>
              Access our research database to explore datasets, methodologies, and findings
              that can help improve water quality monitoring and environmental protection.
            </Typography>
            <Button variant="contained" sx={{ mr: 2 }}>
              Browse Studies
            </Button>
            <Button variant="outlined">
              Submit Research
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Research;