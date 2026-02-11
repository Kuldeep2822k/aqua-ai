import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { MapViewPage } from './pages/MapViewPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        theme={effectiveTheme} // Pass the effective theme so the icon matches reality
        onThemeToggle={toggleTheme}
      />

      {currentPage === 'dashboard' && (
        <Dashboard
          onNavigateToMap={() => setCurrentPage('map')}
          onNavigateToAnalytics={() => setCurrentPage('analytics')}
        />
      )}
      {currentPage === 'map' && <MapViewPage />}
      {currentPage === 'alerts' && <AlertsPage />}
      {currentPage === 'analytics' && <AnalyticsPage />}
      {currentPage === 'settings' && (
        <SettingsPage theme={theme} onThemeChange={setTheme} />
      )}
    </div>
  );
}
