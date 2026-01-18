import React from 'react';
import { Container, Typography, Grid, Paper, Card, CardContent, Box, Button } from '@mui/material';
import { People, Forum, Share } from '@mui/icons-material';

const Community: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Community Hub
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1 }} />
                <Typography variant="h6">Community Members</Typography>
              </Box>
              <Typography variant="h4" color="primary">1,234</Typography>
              <Typography color="textSecondary">Active contributors</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Forum sx={{ mr: 1 }} />
                <Typography variant="h6">Discussions</Typography>
              </Box>
              <Typography variant="h4" color="primary">89</Typography>
              <Typography color="textSecondary">Active topics</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Share sx={{ mr: 1 }} />
                <Typography variant="h6">Shared Reports</Typography>
              </Box>
              <Typography variant="h4" color="primary">456</Typography>
              <Typography color="textSecondary">Community contributions</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Community Activity
            </Typography>
            <Typography color="textSecondary">
              Connect with other water quality researchers and environmental enthusiasts.
              Share your findings, discuss methodologies, and collaborate on projects.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              Join Discussion
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Community;