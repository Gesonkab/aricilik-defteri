/* Arıcılık Defteri saha uygulaması · çevrimdışı önbellek
   İnternet varken sayfa her açılışta sunucudan taze alınır (güncellemeler hemen gelir);
   internet yoksa önbellekteki sürüm açılır. */
var C = 'saha-004b021ecc', FONTS = 'saha-fonts';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    return Promise.all(CORE.map(function (u) { return fetch(new Request(u, { cache: 'reload' })).then(function (res) { if (res.ok) return c.put(u, res); }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C && k !== FONTS; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(FONTS).then(function (c) { return c.match(r).then(function (hit) { return hit || fetch(r).then(function (res) { c.put(r, res.clone()); return res; }); }); }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname)) {
    /* önce ağ (taze sürüm), olmazsa önbellek */
    e.respondWith(fetch(new Request(r.url, { cache: 'no-store' })).then(function (res) {
      if (res && res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put('index.html', cp); c.put('./', res.clone()); }); }
      return res;
    }).catch(function () { return caches.open(C).then(function (c) { return c.match('index.html').then(function (h) { return h || c.match('./'); }); }); }));
    return;
  }
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
