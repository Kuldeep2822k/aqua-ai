import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography, Container, Card, CardContent, Grid } from '@mui/material';
import { WaterDrop } from '@mui/icons-material';

// Simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066cc',
    },
    secondary: {
      main: '#00A8E8',
    },
  },
});

// Simple Dashboard component
function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Aqua-AI Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Water Quality Monitoring System
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Water Bodies Monitored
              </Typography>
              <Typography variant="h3" color="primary">
                1,247
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h3" color="warning.main">
                23
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Simple Navbar */}
          <AppBar position="static">
            <Toolbar>
              <WaterDrop sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Aqua-AI
              </Typography>
            </Toolbar>
          </AppBar>
          
          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;