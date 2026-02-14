import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((mod) => ({ default: mod.Dashboard }))
);
const MapViewPage = lazy(() =>
  import('./pages/MapViewPage').then((mod) => ({ default: mod.MapViewPage }))
);
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((mod) => ({ default: mod.AlertsPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((mod) => ({
    default: mod.AnalyticsPage,
  }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((mod) => ({
    default: mod.SettingsPage,
  }))
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings'
  >('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [isSystemDark, setIsSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // Calculate the effective theme (what is actually shown)
  const effectiveTheme =
    theme === 'auto' ? (isSystemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const toggleTheme = () => {
    if (theme === 'auto') {
      // If currently auto, switch to the opposite of what system provides
      setTheme(isSystemDark ? 'light' : 'dark');
    } else {
      // If manual, just toggle
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const content = useMemo(() => {
    if (currentPage === 'dashboard') {
      return (
        <Dashboard
          onNavigateToMap={() => setCurrentPage('map')}
          onNavigateToAnalytics={() => setCurrentPage('analytics')}
          onNavigateToAlerts={() => setCurrentPage('alerts')}
        />
      );
    }
    if (currentPage === 'map') return <MapViewPage />;
    if (currentPage === 'alerts') return <AlertsPage />;
    if (currentPage === 'analytics') return <AnalyticsPage />;
    return <SettingsPage theme={theme} onThemeChange={setTheme} />;
  }, [currentPage, theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        theme={effectiveTheme} // Pass the effective theme so the icon matches reality
        onThemeToggle={toggleTheme}
      />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          }
        >
          {content}
        </Suspense>
      </ErrorBoundary>
      <Toaster />
    </div>
  );
}
