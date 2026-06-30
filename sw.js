// ═══════════════════════════════════════════════════════════════════
// SERVICE WORKER v3.0 — Modo Offline Completo
// Estrategia: Cache First para recursos estáticos
//             Network First con fallback para imágenes/videos
//             Offline completo con archivos locales del teléfono
// ═══════════════════════════════════════════════════════════════════

var CACHE_NAME = 'avtoizpit-v5';
var CACHE_STATIC = 'avtoizpit-static-v5';
var CACHE_IMG    = 'avtoizpit-img-v5';

// Archivos core que siempre deben estar en cache
var STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './brain.js',
  './agents.js',
  './app.js',
  './data-ranked.js',
  './data-traps.js',
  './data-pts3.js',
  './data-multi.js',
  './data-mrest.js',
  './data-vids.js',
  './data-glos.js',
  './data-vocab.js',
];

// ── Install: cachear archivos estáticos ──────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      return Promise.allSettled(
        STATIC_FILES.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] No se pudo cachear:', url, err.message);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: limpiar caches viejas ──────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== CACHE_STATIC && k !== CACHE_IMG;
        }).map(function(k) {
          return caches.delete(k);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: estrategia inteligente ────────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Ignorar requests no-GET y extensiones de Chrome
  if (e.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension')) return;

  // ── Imágenes de avtoizpit ──────────────────────────────────────
  // Estrategia: Cache First → Network → Fallback SVG
  if (url.includes('avtoizpit.com/api/pictures/') ||
      url.includes('avtoizpit.com/api/videos/')) {
    e.respondWith(
      caches.open(CACHE_IMG).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request, {signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined})
            .then(function(response) {
              if (response && response.ok) {
                cache.put(e.request, response.clone());
              }
              return response;
            })
            .catch(function() {
              // Sin internet y sin cache: devolver SVG placeholder
              if (url.includes('/pictures/')) {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">'+
                  '<rect width="200" height="150" fill="#1c2128" rx="8"/>'+
                  '<text x="100" y="70" text-anchor="middle" fill="#8b949e" font-size="28">🖼️</text>'+
                  '<text x="100" y="100" text-anchor="middle" fill="#8b949e" font-size="11">Sin conexión</text>'+
                  '</svg>',
                  {headers:{'Content-Type':'image/svg+xml'}}
                );
              }
              return new Response('', {status: 503});
            });
        });
      })
    );
    return;
  }

  // ── Imágenes del gobierno búlgaro (rta.government.bg) ─────────
  if (url.includes('rta.government.bg')) {
    e.respondWith(
      caches.open(CACHE_IMG).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request)
            .then(function(response) {
              if (response && response.ok) cache.put(e.request, response.clone());
              return response;
            })
            .catch(function() { return new Response('', {status: 503}); });
        });
      })
    );
    return;
  }

  // ── Archivos estáticos de la app ───────────────────────────────
  // Estrategia: Cache First → Network → Fallback offline page
  if (url.includes(self.location.origin) ||
      url.includes('localhost') ||
      url.startsWith('file://')) {
    e.respondWith(
      caches.open(CACHE_STATIC).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) {
            // En background, actualizar el cache
            fetch(e.request).then(function(fresh) {
              if (fresh && fresh.ok) cache.put(e.request, fresh);
            }).catch(function(){});
            return cached;
          }
          return fetch(e.request)
            .then(function(response) {
              if (response && response.ok) cache.put(e.request, response.clone());
              return response;
            })
            .catch(function() {
              // Sin conexión: intentar la raíz
              return cache.match('./') ||
                new Response('<h1>Sin conexión</h1><p>Avto Izpit PRO funciona offline. Recarga cuando tengas conexión.</p>',
                  {headers:{'Content-Type':'text/html'}});
            });
        });
      })
    );
    return;
  }
});

// ── Mensaje desde la app: pre-cachear imágenes ────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'CACHE_IMAGES') {
    var urls = e.data.urls || [];
    caches.open(CACHE_IMG).then(function(cache) {
      var batch = 0;
      function next() {
        if (batch >= urls.length) {
          e.ports[0] && e.ports[0].postMessage({done:true, cached:batch});
          return;
        }
        cache.add(urls[batch++]).then(next).catch(function(){next();});
      }
      next();
    });
  }

  if (e.data && e.data.type === 'CLEAR_IMG_CACHE') {
    caches.delete(CACHE_IMG).then(function() {
      e.ports[0] && e.ports[0].postMessage({done:true});
    });
  }
});
