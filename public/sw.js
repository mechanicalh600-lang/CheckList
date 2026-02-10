// Update version to force cache refresh and clean old files
const CACHE_NAME = 'cmms-pro-v2.2-no-api-cache';
const REPO_NAME = '/';

const urlsToCache = [
  `${REPO_NAME}`,
  `${REPO_NAME}index.html`,
  `${REPO_NAME}manifest.json`,
  `${REPO_NAME}vite.svg`
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches to prevent serving stale versions
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CRITICAL: Do NOT cache API requests (Supabase, Google APIs)
  // This ensures dashboards and data are always fetched from the server.
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('googleapis.com') ||
      url.pathname.includes('/api/')) {
    return; // Fallback to network only
  }

  // Strategy: Network First for HTML, Cache First (Stale-While-Revalidate pattern) for Assets
  
  if (event.request.mode === 'navigate') {
    // 1. Navigation Request (HTML): Try Network -> Cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, response.clone());
             return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // 2. Asset Request (JS/CSS/Images): Cache First -> Network -> Cache
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached response if found
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Not in cache? Fetch from network
          return fetch(event.request).then(networkResponse => {
             // Only cache valid responses (status 200) and basic/cors requests
             if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                 // Double check not to cache APIs here as well
                 const responseUrl = new URL(networkResponse.url);
                 if (!responseUrl.hostname.includes('supabase.co')) {
                     const responseToCache = networkResponse.clone();
                     caches.open(CACHE_NAME).then(cache => {
                         cache.put(event.request, responseToCache);
                     });
                 }
             }
             return networkResponse;
          });
        })
    );
  }
});