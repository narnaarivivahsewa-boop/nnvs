// RishteClub Lightweight PWA Service Worker
const CACHE_NAME = "rishteclub-shell-v1";
const STATIC_ASSETS = [
  "/nnvs-logo.png",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/payment-qr.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-First with Fallback for Navigation; DO NOT cache sensitive Admin or Auth APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude all admin, auth, payment, integration, and sensitive dynamic endpoints
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/dashboard") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Static images and fonts cache-first
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
        );
      })
    );
  }
});
