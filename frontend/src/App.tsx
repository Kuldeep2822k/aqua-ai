import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import 'leaflet/dist/leaflet.css';
import './App.css';

import i18n from './i18n/config';
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

// Create Material-UI theme with enhanced modern design
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
      light: '#33b3f0',
      dark: '#0077a3',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f57c00',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
      dark: '#b71c1c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
    },
    divider: '#e2e8f0',
    action: {
      hover: 'rgba(0, 102, 204, 0.04)',
      selected: 'rgba(0, 102, 204, 0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#4a4a4a',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#6b7280',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 12px 24px rgba(0, 0, 0, 0.15)',
    '0px 16px 32px rgba(0, 0, 0, 0.15)',
    '0px 20px 40px rgba(0, 0, 0, 0.2)',
    '0px 24px 48px rgba(0, 0, 0, 0.2)',
    '0px 28px 56px rgba(0, 0, 0, 0.25)',
    '0px 32px 64px rgba(0, 0, 0, 0.25)',
    '0px 36px 72px rgba(0, 0, 0, 0.3)',
    '0px 40px 80px rgba(0, 0, 0, 0.3)',
    '0px 44px 88px rgba(0, 0, 0, 0.35)',
    '0px 48px 96px rgba(0, 0, 0, 0.35)',
    '0px 52px 104px rgba(0, 0, 0, 0.4)',
    '0px 56px 112px rgba(0, 0, 0, 0.4)',
    '0px 60px 120px rgba(0, 0, 0, 0.45)',
    '0px 64px 128px rgba(0, 0, 0, 0.45)',
    '0px 68px 136px rgba(0, 0, 0, 0.5)',
    '0px 72px 144px rgba(0, 0, 0, 0.5)',
    '0px 76px 152px rgba(0, 0, 0, 0.55)',
    '0px 80px 160px rgba(0, 0, 0, 0.55)',
    '0px 84px 168px rgba(0, 0, 0, 0.6)',
    '0px 88px 176px rgba(0, 0, 0, 0.6)',
    '0px 92px 184px rgba(0, 0, 0, 0.65)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 102, 204, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, #0066cc 0%, #00A8E8 100%)',
        },
      },
    },
  },
});


function AppContent() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
        <ThemeProvider theme={theme}>
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
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
