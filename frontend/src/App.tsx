import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Toaster } from './components/ui/sonner';
import type { Page, RouteState } from './types/navigation';

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

const pagePaths: Record<Page, string> = {
  dashboard: '/app',
  map: '/app/map',
  alerts: '/app/alerts',
  analytics: '/app/analytics',
  settings: '/app/settings',
};

function getRouteState(pathname: string): RouteState {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  const matchedPage = Object.entries(pagePaths).find(
    ([, path]) => path === normalizedPath
  )?.[0] as Page | undefined;

  if (matchedPage) {
    return { kind: 'app', page: matchedPage };
  }
  if (normalizedPath.startsWith('/app/')) {
    return { kind: 'app', page: 'dashboard' };
  }

  return { kind: 'landing' };
}

function pushPath(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    getRouteState(window.location.pathname)
  );
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

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getRouteState(window.location.pathname));
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

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
      setTheme(isSystemDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const navigateToPage = useCallback((page: Page) => {
    pushPath(pagePaths[page]);
  }, []);

  const navigateHome = useCallback(() => {
    pushPath('/');
  }, []);

  const content = useMemo(() => {
    if (route.kind === 'landing') {
      return (
        <LandingPage
          onEnterApp={() => navigateToPage('dashboard')}
          onViewMap={() => navigateToPage('map')}
        />
      );
    }

    const appPages: Record<Page, () => JSX.Element> = {
      dashboard: () => (
        <Dashboard
          onNavigateToMap={() => navigateToPage('map')}
          onNavigateToAnalytics={() => navigateToPage('analytics')}
          onNavigateToAlerts={() => navigateToPage('alerts')}
        />
      ),
      map: () => <MapViewPage />,
      alerts: () => <AlertsPage />,
      analytics: () => <AnalyticsPage />,
      settings: () => <SettingsPage theme={theme} onThemeChange={setTheme} />,
    };

    return appPages[route.page]();
  }, [navigateToPage, route, theme]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {route.kind === 'app' && (
        <Header
          currentPage={route.page}
          onNavigate={navigateToPage}
          onNavigateHome={navigateHome}
          theme={effectiveTheme}
          onThemeToggle={toggleTheme}
        />
      )}
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
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
