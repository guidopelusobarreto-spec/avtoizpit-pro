// ═══════════════════════════════════════════════════════════════════
// SERVICE WORKER — Modo Offline Completo
// BUILD_ID se genera automáticamente — nunca hay que tocarlo a mano.
// Estrategia:
//   - JS de la app (app.js, brain.js, agents.js, data-*.js) → Network First
//     siempre intenta traer la versión más reciente; si no hay internet,
//     usa la copia en cache. Así una actualización se ve de inmediato
//     sin tener que cambiar ningún número de versión.
//   - HTML/manifest → Network First también (mismo motivo)
//   - Imágenes/videos → Cache First con fallback offline
// ═══════════════════════════════════════════════════════════════════

var BUILD_ID = '2026-09-06T13-00';   // se regenera automáticamente en cada build
var CACHE_STATIC = 'avtoizpit-static-' + BUILD_ID;
var CACHE_IMG    = 'avtoizpit-img';   // las imágenes no cambian, no necesitan versión

// Archivos core que siempre deben estar en cache
var STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './brain.js',
  './agents.js',
  './app.js',
  './data-ranked.js',
  './data-leyes.js',
  './data-lex.js',
  './data-traps.js',
  './data-pts3.js',
  './data-multi.js',
  './data-mrest1.js',
  './data-mrest2.js',
  './data-mrest3.js',
  './data-vids.js',
  './data-glos.js',
  './data-vocab.js',
];

// Extensiones que SIEMPRE deben ir Network First (código/datos que cambian)
var NETWORK_FIRST_EXT = ['.js', '.html', '.json'];

function isNetworkFirst(url) {
  return NETWORK_FIRST_EXT.some(function(ext) { return url.split('?')[0].endsWith(ext); }) ||
         url.endsWith('/') ;
}

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
      return self.skipWaiting(); // activar inmediatamente, sin esperar a cerrar pestañas
    })
  );
});

// ── Activate: limpiar TODAS las caches static viejas automáticamente ──
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          // Borra cualquier cache "avtoizpit-static-*" que no sea la actual
          return k.startsWith('avtoizpit-static-') && k !== CACHE_STATIC;
        }).map(function(k) {
          return caches.delete(k);
        })
      );
    }).then(function() {
      return self.clients.claim(); // tomar control de las pestañas abiertas ya mismo
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

  // ── Archivos estáticos de la app (JS/HTML/JSON) ───────────────────
  // NETWORK FIRST: siempre intenta traer la versión más reciente del
  // servidor. Si lo consigue, actualiza el cache y lo sirve.
  // Si NO hay internet, sirve la última copia que haya en cache.
  // Esto hace innecesario tocar ningún número de versión a mano.
  if (url.includes(self.location.origin) ||
      url.includes('localhost') ||
      url.startsWith('file://')) {
    if (isNetworkFirst(url)) {
      e.respondWith(
        fetch(e.request, {cache: 'no-store'})
          .then(function(response) {
            if (response && response.ok) {
              var clone = response.clone();
              caches.open(CACHE_STATIC).then(function(cache) { cache.put(e.request, clone); });
            }
            return response;
          })
          .catch(function() {
            return caches.open(CACHE_STATIC).then(function(cache) {
              return cache.match(e.request).then(function(cached) {
                return cached || cache.match('./') ||
                  new Response('<h1>Sin conexión</h1><p>Avto Izpit PRO funciona offline. Recarga cuando tengas conexión.</p>',
                    {headers:{'Content-Type':'text/html'}});
              });
            });
          })
      );
      return;
    }
    // Otros archivos estáticos (iconos, etc.) — Cache First normal
    e.respondWith(
      caches.open(CACHE_STATIC).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(response) {
            if (response && response.ok) cache.put(e.request, response.clone());
            return response;
          }).catch(function() { return new Response('', {status: 503}); });
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
