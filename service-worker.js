/* service-worker.js */
const VERSION = 'v1.0.0';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './products.json',
  './stores.html',
  './stores.json',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))));
  self.clients.claim();
});

// Network-first для HTML, Stale-while-revalidate для JSON, Cache-first для картинок
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (e.request.destination === 'document') {
    e.respondWith(fetch(e.request).then(r=>{
      const clone = r.clone();
      caches.open(VERSION).then(c=>c.put(e.request, clone));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }

  if (url.pathname.endsWith('.json')) {
    e.respondWith(caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(r=>{
        const rc = r.clone(); caches.open(VERSION).then(c=>c.put(e.request, rc)); return r;
      }).catch(()=>cached);
      return cached || fetchPromise;
    }));
    return;
  }

  if (['image','style','script','font'].includes(e.request.destination)) {
    e.respondWith(caches.match(e.request).then(cached=>cached || fetch(e.request).then(r=>{
      const rc = r.clone(); caches.open(VERSION).then(c=>c.put(e.request, rc)); return r;
    }).catch(()=>cached)));
    return;
  }
}); 
