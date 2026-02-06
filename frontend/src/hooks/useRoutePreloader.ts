import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface RoutePreloadConfig {
  [path: string]: {
    component: () => Promise<any>;
    priority: 'high' | 'medium' | 'low';
    preloadTrigger?: 'immediate' | 'idle' | 'hover' | 'visible';
    dependencies?: string[]; // Other routes that should be preloaded together
  };
}

// Route configuration with preload strategies
const ROUTE_CONFIG: RoutePreloadConfig = {
  '/': {
    component: () => import('../pages/Dashboard'),
    priority: 'high',
    preloadTrigger: 'immediate',
  },
  '/dashboard': {
    component: () => import('../pages/Dashboard'),
    priority: 'high',
    preloadTrigger: 'immediate',
  },
  '/map': {
    component: () => import('../pages/MapView'),
    priority: 'high',
    preloadTrigger: 'idle',
    dependencies: ['/analytics'], // Maps and analytics are often used together
  },
  '/analytics': {
    component: () => import('../pages/Analytics'),
    priority: 'medium',
    preloadTrigger: 'idle',
    dependencies: ['/map'],
  },
  '/alerts': {
    component: () => import('../pages/Alerts'),
    priority: 'medium',
    preloadTrigger: 'idle',
  },
  '/community': {
    component: () => import('../pages/Community'),
    priority: 'low',
    preloadTrigger: 'visible',
  },
  '/research': {
    component: () => import('../pages/Research'),
    priority: 'low',
    preloadTrigger: 'visible',
  },
  '/sustainability': {
    component: () => import('../pages/Sustainability'),
    priority: 'low',
    preloadTrigger: 'visible',
  },
  '/settings': {
    component: () => import('../pages/Settings'),
    priority: 'low',
    preloadTrigger: 'hover',
  },
};

// Cache to track preloaded routes
const preloadedRoutes = new Set<string>();
const preloadPromises = new Map<string, Promise<any>>();

export const useRoutePreloader = () => {
  const location = useLocation();
  const preloadTimeoutRefs = useRef<Map<string, number>>(new Map());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isTest = process.env.NODE_ENV === 'test';

  // Preload a specific route
  const preloadRoute = useCallback(async (path: string): Promise<void> => {
    if (isTest) return Promise.resolve();
    if (preloadedRoutes.has(path)) {
      return Promise.resolve();
    }

    const routeConfig = ROUTE_CONFIG[path];
    if (!routeConfig) {
      console.warn(`Route config not found for ${path}`);
      return Promise.resolve();
    }

    // Check if preload is already in progress
    if (preloadPromises.has(path)) {
      return preloadPromises.get(path)!;
    }

    // Start preloading
    const preloadPromise = routeConfig
      .component()
      .then((module) => {
        preloadedRoutes.add(path);
        preloadPromises.delete(path);
        console.log(`✅ Preloaded route: ${path}`);
        return module;
      })
      .catch((error) => {
        preloadPromises.delete(path);
        console.warn(`❌ Failed to preload route ${path}:`, error);
        throw error;
      });

    preloadPromises.set(path, preloadPromise);
    return preloadPromise;
  }, []);

  // Preload routes based on priority and trigger
  const executePreloadStrategy = useCallback(
    async (routes: string[]) => {
      if (isTest) return;
      // Group routes by priority
      const highPriority = routes.filter(
        (path) => ROUTE_CONFIG[path]?.priority === 'high'
      );
      const mediumPriority = routes.filter(
        (path) => ROUTE_CONFIG[path]?.priority === 'medium'
      );
      const lowPriority = routes.filter(
        (path) => ROUTE_CONFIG[path]?.priority === 'low'
      );

      // Preload high priority immediately
      await Promise.all(highPriority.map((path) => preloadRoute(path)));

      // Preload medium priority with small delay
      window.setTimeout(() => {
        Promise.all(mediumPriority.map((path) => preloadRoute(path)));
      }, 100);

      // Preload low priority when idle
      if (window.requestIdleCallback) {
        window.requestIdleCallback(
          () => {
            Promise.all(lowPriority.map((path) => preloadRoute(path)));
          },
          { timeout: 5000 }
        );
      } else {
        window.setTimeout(() => {
          Promise.all(lowPriority.map((path) => preloadRoute(path)));
        }, 2000);
      }
    },
    [isTest, preloadRoute]
  );

  // Preload routes on app start
  useEffect(() => {
    if (isTest) return;
    const routesToPreload = Object.keys(ROUTE_CONFIG).filter((path) => {
      const config = ROUTE_CONFIG[path];
      return (
        config.preloadTrigger === 'immediate' ||
        config.preloadTrigger === 'idle'
      );
    });

    executePreloadStrategy(routesToPreload);
  }, [executePreloadStrategy, isTest]);

  // Preload dependencies when navigating
  useEffect(() => {
    if (isTest) return;
    const currentPath = location.pathname;
    const config = ROUTE_CONFIG[currentPath];

    if (config?.dependencies?.length) {
      // Preload dependencies with a slight delay to avoid blocking current route
      window.setTimeout(() => {
        config.dependencies!.forEach((depPath) => preloadRoute(depPath));
      }, 500);
    }
  }, [isTest, location.pathname, preloadRoute]);

  // Create intersection observer for visible preloading
  useEffect(() => {
    if (isTest) return;
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            entry.target.hasAttribute('data-preload-route')
          ) {
            const routePath = entry.target.getAttribute('data-preload-route');
            if (routePath) {
              preloadRoute(routePath);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [isTest, preloadRoute]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      const timeoutRefs = preloadTimeoutRefs.current;
      timeoutRefs.forEach((timeout) => window.clearTimeout(timeout));
      timeoutRefs.clear();
    };
  }, []);

  // Manual preload function for hover events
  const preloadOnHover = useCallback(
    (path: string) => {
      const timeoutId = window.setTimeout(() => preloadRoute(path), 50); // Small delay for accidental hovers
      preloadTimeoutRefs.current.set(path, timeoutId);
    },
    [preloadRoute]
  );

  const cancelPreloadOnHover = useCallback((path: string) => {
    const timeoutId = preloadTimeoutRefs.current.get(path);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      preloadTimeoutRefs.current.delete(path);
    }
  }, []);

  // Observe element for visible preloading
  const observeElement = useCallback(
    (element: HTMLElement, routePath: string) => {
      if (intersectionObserverRef.current) {
        element.setAttribute('data-preload-route', routePath);
        intersectionObserverRef.current.observe(element);
      }
    },
    []
  );

  const unobserveElement = useCallback((element: HTMLElement) => {
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.unobserve(element);
    }
  }, []);

  return {
    preloadRoute,
    preloadOnHover,
    cancelPreloadOnHover,
    observeElement,
    unobserveElement,
    preloadedRoutes: Array.from(preloadedRoutes),
  };
};

// Hook to track and report preloading performance
export const usePreloadAnalytics = () => {
  const [metrics, setMetrics] = React.useState({
    preloadedCount: 0,
    totalRoutes: Object.keys(ROUTE_CONFIG).length,
    preloadTime: 0,
    cacheHitRate: 0,
  });

  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      setMetrics((prev) => ({
        ...prev,
        preloadedCount: preloadedRoutes.size,
        preloadTime: endTime - startTime,
        cacheHitRate:
          (preloadedRoutes.size / Object.keys(ROUTE_CONFIG).length) * 100,
      }));
    };
  }, []);

  return metrics;
};

// Utility function to add prefetch hints to document head
export const addPrefetchHints = () => {
  const criticalRoutes = ['/dashboard', '/map', '/analytics'];

  criticalRoutes.forEach((route) => {
    // Don't add if already exists
    if (document.querySelector(`link[href*="${route}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};

export default useRoutePreloader;
