const CACHE_NAME = "hermes-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  console.log("⚡️ Service Worker installed");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (response) =>
          response ||
          fetch(event.request).catch(() => caches.match("/index.html"))
      )
  );
});

self.addEventListener("activate", () => {
  console.log("🔁 Service Worker activated");
});
