const CACHE_NAME = "budgie-cache-v1";
const urlsToCache = [
  "/",
  "/expenses",
  "/global-dashboard",
  "/settings",
];

// Install event - cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        // Cache successful GET requests
        if (event.request.method === "GET" && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // If not in cache and it's a navigation request, return the index page
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: data.actions || [],
    tag: data.tag || "budgie-notification",
    renotify: true,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event - navigate to relevant section
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(url);
            }
            return;
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

