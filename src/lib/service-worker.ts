/**
 * Service Worker for offline-first functionality
 * Optimized for free tier deployment constraints
 */

const CACHE_NAME = 'drive-manager-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard/drive',
  '/offline.html',
  // Add your static assets here
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/drive/files',
  '/api/auth/check-drive-access'
];

declare const self: ServiceWorkerGlobalScope;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache API responses
      caches.open(API_CACHE).then(cache => {
        // Pre-cache common API responses if needed
        return Promise.resolve();
      })
    ]).then(() => {
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with network-first strategy
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.includes('.')) {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticRequest(request));
  } else {
    // Navigation requests - network-first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests with intelligent caching
async function handleAPIRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (!isCacheable) {
    // Non-cacheable API requests - direct network
    return fetch(request);
  }

  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for cache invalidation
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid (15 minutes)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age < 15 * 60 * 1000) { // 15 minutes
          return cachedResponse;
        }
      }
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable and no cached data' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request: Request): Promise<Response> {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    // Try network first
    return await fetch(request);
  } catch (error) {
    // Network failed - return cached page or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Background sync for queued operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'drive-operations') {
    event.waitUntil(processQueuedOperations());
  }
});

// Process queued operations when back online
async function processQueuedOperations() {
  try {
    // Get queued operations from IndexedDB
    const operations = await getQueuedOperations();
    
    for (const operation of operations) {
      try {
        await processOperation(operation);
        await removeQueuedOperation(operation.id);
      } catch (error) {
        console.error('Failed to process queued operation:', error);
      }
    }
  } catch (error) {
    console.error('Failed to process queued operations:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getQueuedOperations(): Promise<any[]> {
  // Implementation would interact with IndexedDB
  return [];
}

async function processOperation(operation: any): Promise<void> {
  // Implementation would make API calls
}

async function removeQueuedOperation(id: string): Promise<void> {
  // Implementation would remove from IndexedDB
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png'
      })
    );
  }
});

export {};