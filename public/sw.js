// Lumen service worker — offline app shell.
// Bump VERSION whenever you want every installed copy to drop its old cache.
const VERSION = 'lumen-v2'
// Paths are relative to this file, so the app works at a domain root or in a subfolder.
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']
const INDEX = new URL('./index.html', self.location).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Page navigations: network first so updates arrive, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(INDEX, copy))
          return res
        })
        .catch(() => caches.match(INDEX))
    )
    return
  }

  // Static assets (Vite hashes their names): cache first, then fill the cache.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})
