/* 세계일주 부동산왕 — 오프라인 서비스 워커 */
const VER = 'wt-v8';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 페이지: 네트워크 우선(최신 버전), 실패하면 캐시 → 오프라인 실행
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 글꼴·정적 파일: 캐시 우선, 백그라운드 갱신
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
