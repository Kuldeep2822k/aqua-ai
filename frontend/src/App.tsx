import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import './App.css';

import i18n from './i18n/config';
import { NotificationProvider } from './contexts/NotificationContext';
import { PWAProvider } from './contexts/PWAContext';
import { useServiceWorker } from './hooks/useServiceWorker';

// Core Components
import Navbar from './components/Navigation/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages - Lazy loaded for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MapView = React.lazy(() => import('./pages/MapView'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const Community = React.lazy(() => import('./pages/Community'));
const Research = React.lazy(() => import('./pages/Research'));
const Sustainability = React.lazy(() => import('./pages/Sustainability'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Initialize service worker for PWA
  useServiceWorker();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <PWAProvider>
            <NotificationProvider>
              <CssBaseline />
              <Router>
                <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                  <Navbar onSidebarToggle={handleSidebarToggle} />
                  <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                  
                  <Box 
                    component="main" 
                    sx={{ 
                      flexGrow: 1, 
                      p: 0, 
                      mt: 8, // Account for navbar height
                      ml: { xs: 0, sm: sidebarOpen ? 30 : 0 },
                      transition: 'margin 0.3s ease-in-out',
                    }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/research" element={<Research />} />
                        <Route path="/sustainability" element={<Sustainability />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </Suspense>
                  </Box>
                </Box>
              </Router>
              
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </NotificationProvider>
          </PWAProvider>
        </I18nextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
