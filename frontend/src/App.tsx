import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, Box } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import 'leaflet/dist/leaflet.css';
import './App.css';

import i18n from './i18n/config';
import { CustomThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PWAProvider } from './contexts/PWAContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useRoutePreloader, addPrefetchHints } from './hooks/useRoutePreloader';
import { initGA, initScrollTracking } from './utils/analytics';

// Core Components
import Navbar from './components/Navigation/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages - Lazy loaded for better performance with preloading hints
const Dashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './pages/Dashboard')
);
const MapView = React.lazy(() =>
  import(/* webpackChunkName: "map-view" */ './pages/MapView')
);
const Analytics = React.lazy(() =>
  import(/* webpackChunkName: "analytics" */ './pages/Analytics')
);
const Alerts = React.lazy(() =>
  import(/* webpackChunkName: "alerts" */ './pages/Alerts')
);
const Community = React.lazy(() =>
  import(/* webpackChunkName: "community" */ './pages/Community')
);
const Research = React.lazy(() =>
  import(/* webpackChunkName: "research" */ './pages/Research')
);
const Sustainability = React.lazy(() =>
  import(/* webpackChunkName: "sustainability" */ './pages/Sustainability')
);
const Settings = React.lazy(() =>
  import(/* webpackChunkName: "settings" */ './pages/Settings')
);

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

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { mode } = useThemeContext(); // Use theme context to get current mode for background styles

  // Initialize route preloading for better performance - MUST be used inside Router
  useRoutePreloader();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          mt: { xs: 7, sm: 8 }, // Account for navbar height
          ml: {
            xs: 0,
            sm: sidebarOpen ? '240px' : 0,
            md: sidebarOpen ? '280px' : 0
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: 'calc(100vh - 64px)',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
  );
}

function App() {
  // Initialize service worker - does not need Router context
  useServiceWorker();

  // Add prefetch hints and initialize analytics on mount - does not need Router context
  React.useEffect(() => {
    addPrefetchHints();
    initGA();
    const scrollCleanup = initScrollTracking();

    return scrollCleanup;
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <I18nextProvider i18n={i18n}>
            <PWAProvider>
              <NotificationProvider>
                <CssBaseline />
                <Router>
                  <AppContent />
                </Router>

                {process.env.NODE_ENV === 'development' && (
                  <></>
                )}
              </NotificationProvider>
            </PWAProvider>
          </I18nextProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
