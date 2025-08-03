const CACHE_NAME = "musica-v1.2.0"
const STATIC_CACHE = "musica-static-v1.2.0"
const DYNAMIC_CACHE = "musica-dynamic-v1.2.0"
const AUDIO_CACHE = "musica-audio-v1.2.0"

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/search",
  "/library",
  "/profile",
  "/games",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/offline.html",
]

// Audio URLs that should be cached
const AUDIO_CACHE_PATTERNS = [/\.mp3$/, /\.wav$/, /\.ogg$/, /\.m4a$/, /jamendo\.com.*audio/, /saavn\.me.*audio/]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...")

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("📦 Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      }),
      self.skipWaiting(),
    ]),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated")

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== AUDIO_CACHE) {
                console.log("🗑️ Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
      self.clients.claim(),
    ]),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Handle different types of requests
  if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// Audio caching strategy - Cache First with fallback
async function handleAudioRequest(request) {
  try {
    const cache = await caches.open(AUDIO_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log("🎵 Serving audio from cache:", request.url)
      return cachedResponse
    }

    console.log("🌐 Fetching audio from network:", request.url)
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful audio responses
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("❌ Audio request failed:", error)
    return new Response("Audio unavailable offline", { status: 503 })
  }
}

// API caching strategy - Network First with cache fallback
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)

    // Try network first
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful API responses
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    console.log("🌐 Network failed, trying cache for:", request.url)

    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This content is not available offline",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Static assets - Cache First
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response("Asset unavailable offline", { status: 503 })
  }
}

// Navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    console.log("🌐 Navigation offline, serving cached page")

    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Serve offline page
    return caches.match("/offline.html") || caches.match("/") || new Response("Offline", { status: 503 })
  }
}

// Dynamic requests - Network First
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    return (
      cachedResponse ||
      new Response("Content unavailable offline", {
        status: 503,
      })
    )
  }
}

// Helper functions
function isAudioRequest(request) {
  return AUDIO_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("jamendo") ||
    url.hostname.includes("saavn") ||
    url.hostname.includes("musicapi")
  )
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept").includes("text/html"))
  )
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync triggered:", event.tag)

  if (event.tag === "sync-favorites") {
    event.waitUntil(syncFavorites())
  } else if (event.tag === "sync-playlists") {
    event.waitUntil(syncPlaylists())
  }
})

async function syncFavorites() {
  try {
    // Sync favorite songs when back online
    const favorites = await getStoredFavorites()
    if (favorites.length > 0) {
      await fetch("/api/sync-favorites", {
        method: "POST",
        body: JSON.stringify(favorites),
        headers: { "Content-Type": "application/json" },
      })
      console.log("✅ Favorites synced successfully")
    }
  } catch (error) {
    console.error("❌ Failed to sync favorites:", error)
  }
}

async function syncPlaylists() {
  try {
    // Sync playlists when back online
    const playlists = await getStoredPlaylists()
    if (playlists.length > 0) {
      await fetch("/api/sync-playlists", {
        method: "POST",
        body: JSON.stringify(playlists),
        headers: { "Content-Type": "application/json" },
      })
      console.log("✅ Playlists synced successfully")
    }
  } catch (error) {
    console.error("❌ Failed to sync playlists:", error)
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("📱 Push notification received")

  const options = {
    body: event.data ? event.data.text() : "New music available!",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
    actions: [
      {
        action: "open",
        title: "Open Musica",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Musica", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"))
  }
})

// Helper functions for storage
async function getStoredFavorites() {
  // Implementation would depend on your storage strategy
  return []
}

async function getStoredPlaylists() {
  // Implementation would depend on your storage strategy
  return []
}

// Message handling for communication with main thread
self.addEventListener("message", (event) => {
  console.log("💬 Message received in SW:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
