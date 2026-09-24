/* RH-Trümmersuchassistent – Service Worker: startet die App auch ohne Internet (z. B. im Funkloch).
   Die Daten liegen im lokalen Gerätespeicher, nicht in diesem Cache.
   Bei jeder neuen Version CACHE_VERSION erhöhen. */
const CACHE_VERSION = 'truemmersuche-2.2.0';
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
/* Kartenbibliothek (Leaflet): mitgespeichert, damit Wetter- und Online-Karte offline zumindest starten. Kacheln benötigen weiterhin Internet. */
const BIBLIOTHEKEN = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_VERSION).then(c=>
    // Einzeln laden: eine fehlende Datei (z. B. ein Icon) darf die Installation nicht komplett verhindern.
    Promise.allSettled([...DATEIEN, ...BIBLIOTHEKEN].map(u=>c.add(u).catch(()=>{})))
  ).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE_VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const u = new URL(e.request.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{ const k=r.clone(); caches.open(CACHE_VERSION).then(c=>c.put(e.request,k)); return r; })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(u.host==='cdnjs.cloudflare.com'){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{ const k=n.clone(); caches.open(CACHE_VERSION).then(c=>c.put(e.request,k)); return n; })));
  }
  // Wetter, Ortssuche und Kartenkacheln laufen bewusst am Service Worker vorbei.
});
