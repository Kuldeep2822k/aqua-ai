import { useCallback, useRef, useEffect } from 'react';

interface DOMOperation {
  id: string;
  operation: () => void;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Custom hook to optimize performance by batching DOM operations
 * and preventing forced reflows
 */
export const usePerformanceOptimizer = () => {
  const operationQueue = useRef<DOMOperation[]>([]);
  const isProcessing = useRef(false);
  const frameId = useRef<number>();

  // Batch DOM reads to prevent forced reflows
  const batchDOMReads = useCallback((readOperations: (() => void)[]) => {
    // Execute all reads in a single frame
    requestAnimationFrame(() => {
      readOperations.forEach((op) => op());
    });
  }, []);

  // Batch DOM writes to prevent forced reflows
  const batchDOMWrites = useCallback((writeOperations: (() => void)[]) => {
    // Execute all writes in a single frame after reads
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        writeOperations.forEach((op) => op());
      });
    });
  }, []);

  // Queue DOM operation with priority
  const queueOperation = useCallback(
    (
      id: string,
      operation: () => void,
      priority: 'low' | 'normal' | 'high' = 'normal'
    ) => {
      operationQueue.current.push({ id, operation, priority });

      if (!isProcessing.current) {
        processQueue();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Process queued operations
  const processQueue = useCallback(() => {
    if (operationQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;

    // Sort by priority
    operationQueue.current.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    frameId.current = requestAnimationFrame(() => {
      const operations = operationQueue.current.splice(0, 5); // Process max 5 per frame

      operations.forEach(({ operation }) => {
        try {
          operation();
        } catch (error) {
          console.warn('Performance optimizer operation failed:', error);
        }
      });

      // Continue processing if more operations remain
      if (operationQueue.current.length > 0) {
        processQueue();
      } else {
        isProcessing.current = false;
      }
    });
  }, []);

  // Debounced resize handler to prevent excessive reflows
  const createDebouncedResizeHandler = useCallback(
    (
      handler: () => void,
      delay: number = 16 // ~60fps
    ) => {
      let timeoutId: NodeJS.Timeout;

      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          requestAnimationFrame(handler);
        }, delay);
      };
    },
    []
  );

  // Optimize scroll performance
  const createOptimizedScrollHandler = useCallback(
    (
      handler: (event: Event) => void,
      options: { passive?: boolean; throttle?: number } = {}
    ) => {
      const { passive: _passive = true, throttle = 16 } = options;
      let lastExecution = 0;

      return (event: Event) => {
        const now = Date.now();

        if (now - lastExecution >= throttle) {
          lastExecution = now;
          requestAnimationFrame(() => handler(event));
        }
      };
    },
    []
  );

  // Prevent layout thrashing when measuring elements
  const measureElements = useCallback(
    (elements: HTMLElement[], callback: (measurements: DOMRect[]) => void) => {
      requestAnimationFrame(() => {
        const measurements = elements.map((el) => el.getBoundingClientRect());
        callback(measurements);
      });
    },
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);

  return {
    batchDOMReads,
    batchDOMWrites,
    queueOperation,
    createDebouncedResizeHandler,
    createOptimizedScrollHandler,
    measureElements,
  };
};

// Utility function to check if an element is in viewport (for lazy loading)
export const isInViewport = (
  element: HTMLElement,
  threshold: number = 0
): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= windowHeight + threshold &&
    rect.right <= windowWidth + threshold
  );
};

// Utility to create a performance observer for Core Web Vitals
export const createCoreWebVitalsObserver = (
  onMetric: (metric: { name: string; value: number; rating: string }) => void
) => {
  // Observer for LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            const value = entry.startTime;
            const rating =
              value > 4000
                ? 'poor'
                : value > 2500
                  ? 'needs-improvement'
                  : 'good';
            onMetric({ name: 'LCP', value, rating });
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      return () => observer.disconnect();
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  return () => { };
};
