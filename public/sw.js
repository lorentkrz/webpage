// Placeholder service worker to silence 404s. Replace with real SW if needed.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: pass-through.
});
