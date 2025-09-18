import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container, Typography, Card, CardContent, Grid } from '@mui/material';

// Simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066cc',
      light: '#4d94ff',
      dark: '#004499',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00A8E8',
      contrastText: '#ffffff',
    },
  },
});

// Simple Dashboard without external dependencies
function Dashboard() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Aqua-AI Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Water Quality Monitoring System
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="div">
                1,247
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Water Bodies Monitored
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="div">
                23
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Active Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="div">
                15%
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Quality Improvement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="div">
                456
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Community Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

// Simple loading component
function SimpleLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
      }}
    >
      <Typography>Loading...</Typography>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
          <main>
            <Suspense fallback={<SimpleLoading />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </Suspense>
          </main>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;