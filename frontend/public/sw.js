const CACHE_NAME = 'aqua-ai-v1.0.0';
const STATIC_CACHE_NAME = 'aqua-ai-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'aqua-ai-dynamic-v1.0.0';

// Resources to cache immediately
const PRECACHE_URLS = ['/', '/manifest.json', '/favicon.ico'];

// Cache strategy configurations
const CACHE_STRATEGIES = {
  // JavaScript chunks - cache first with fallback
  js: {
    pattern: /\.js$/,
    strategy: 'cacheFirst',
    cacheName: 'js-cache-v1',
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  // CSS files - cache first
  css: {
    pattern: /\.css$/,
    strategy: 'cacheFirst',
    cacheName: 'css-cache-v1',
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  // Images - cache first with fallback
  images: {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
    strategy: 'cacheFirst',
    cacheName: 'image-cache-v1',
    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  },
  // API calls - network first with cache fallback
  api: {
    pattern: /\/api\//,
    strategy: 'networkFirst',
    cacheName: 'api-cache-v1',
    maxAgeSeconds: 60 * 60, // 1 hour
  },
  // Map tiles - cache first
  mapTiles: {
    pattern: /tile\.openstreetmap\.org/,
    strategy: 'cacheFirst',
    cacheName: 'map-tiles-v1',
    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  },
};

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        // Don't fail if some assets can't be cached
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache
              .add(url)
              .catch((err) => console.warn(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Precaching completed');
        // Force activation immediately
        return self.skipWaiting();
      })
      .catch((err) => console.error('[SW] Precaching failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Take control of all clients
      self.clients.claim(),

      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                !Object.values(CACHE_STRATEGIES).some(
                  (strategy) => strategy.cacheName === cacheName
                )
              );
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Find matching cache strategy
  let strategy = null;
  let config = null;

  for (const [name, strategyConfig] of Object.entries(CACHE_STRATEGIES)) {
    if (
      strategyConfig.pattern.test(url.pathname) ||
      strategyConfig.pattern.test(url.href)
    ) {
      strategy = strategyConfig.strategy;
      config = strategyConfig;
      break;
    }
  }

  // Default to network first for unknown resources
  if (!strategy) {
    strategy = 'networkFirst';
    config = {
      cacheName: DYNAMIC_CACHE_NAME,
      maxAgeSeconds: 60 * 60, // 1 hour
    };
  }

  // Apply the determined strategy
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirst(request, config));
      break;
    case 'networkFirst':
      event.respondWith(networkFirst(request, config));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request, config));
      break;
    default:
      event.respondWith(networkFirst(request, config));
  }
});

// Cache first strategy - check cache first, fallback to network
async function cacheFirst(request, config) {
  try {
    const cache = await caches.open(config.cacheName);
    const cached = await cache.match(request);

    if (cached) {
      // Check if cached response is still fresh
      const cachedTime = new Date(cached.headers.get('sw-cached-time') || 0);
      const now = new Date();
      const age = (now - cachedTime) / 1000; // age in seconds

      if (age < config.maxAgeSeconds) {
        console.log(`[SW] Cache hit (fresh): ${request.url}`);
        return cached;
      }
    }

    // Fetch from network
    console.log(`[SW] Cache miss or stale, fetching: ${request.url}`);
    const response = await fetch(request);

    if (response.ok) {
      // Clone and add timestamp before caching
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());

      const modifiedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
      console.log(`[SW] Cached: ${request.url}`);
    }

    return response;
  } catch (error) {
    console.error(`[SW] Cache first failed for ${request.url}:`, error);

    // Try to return stale cache as fallback
    const cache = await caches.open(config.cacheName);
    const cached = await cache.match(request);
    if (cached) {
      console.log(`[SW] Returning stale cache: ${request.url}`);
      return cached;
    }

    // Return a minimal error response for JS/CSS files
    if (request.url.endsWith('.js') || request.url.endsWith('.css')) {
      return new Response('/* Resource unavailable offline */', {
        status: 200,
        headers: {
          'Content-Type': request.url.endsWith('.js')
            ? 'text/javascript'
            : 'text/css',
        },
      });
    }

    throw error;
  }
}

// Network first strategy - try network first, fallback to cache
async function networkFirst(request, config) {
  try {
    console.log(`[SW] Network first: ${request.url}`);
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(config.cacheName);
      const responseToCache = response.clone();

      // Add timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());

      const modifiedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
      console.log(`[SW] Network response cached: ${request.url}`);
    }

    return response;
  } catch (error) {
    console.log(`[SW] Network failed, trying cache: ${request.url}`);
    const cache = await caches.open(config.cacheName);
    const cached = await cache.match(request);

    if (cached) {
      console.log(`[SW] Cache hit (network failed): ${request.url}`);
      return cached;
    }

    console.error(
      `[SW] Both network and cache failed for ${request.url}:`,
      error
    );
    throw error;
  }
}

// Stale while revalidate - return cache immediately, update in background
async function staleWhileRevalidate(request, config) {
  const cache = await caches.open(config.cacheName);
  const cached = await cache.match(request);

  // Start fetch in background (don't await)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const responseToCache = response.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-time', new Date().toISOString());

        const modifiedResponse = new Response(responseToCache.blob(), {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });

        cache.put(request, modifiedResponse);
        console.log(`[SW] Background update cached: ${request.url}`);
      }
      return response;
    })
    .catch((err) => {
      console.warn(`[SW] Background update failed for ${request.url}:`, err);
    });

  // Return cached version immediately if available
  if (cached) {
    console.log(`[SW] Stale while revalidate (cached): ${request.url}`);
    return cached;
  }

  // If no cache, wait for network
  console.log(
    `[SW] Stale while revalidate (no cache, waiting): ${request.url}`
  );
  return fetchPromise;
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    console.log('[SW] Received cache request for URLs:', event.data.urls);
    const urls = event.data.urls || [];

    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          urls.map((url) =>
            cache
              .add(url)
              .catch((err) =>
                console.warn('[SW] Failed to pre-cache URL:', url, err)
              )
          )
        );
      })
    );
  }
});

// Cleanup old entries in caches periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  console.log('[SW] Starting cache cleanup');

  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = new Date(
          response.headers.get('sw-cached-time') || 0
        );
        const now = new Date();
        const age = (now - cachedTime) / 1000;

        // Remove entries older than 7 days
        if (age > 60 * 60 * 24 * 7) {
          console.log(`[SW] Removing old cache entry: ${request.url}`);
          await cache.delete(request);
        }
      }
    }
  }

  console.log('[SW] Cache cleanup completed');
}

console.log('[SW] Service worker script loaded');
