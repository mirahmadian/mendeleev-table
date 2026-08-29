const CACHE = 'onsoryab-v2';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // آهنگ‌ها و فهرست گیت‌هاب همیشه تازه خوانده شوند، نه از کش
  if (url.includes('api.github.com') || url.includes('raw.githubusercontent.com') || /\.(mp3|ogg|wav|m4a|aac)(\?|$)/i.test(url)) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // برای صفحه و فایل‌های اصلی برنامه: همیشه اول از شبکه بخوان تا آخرین نسخه بیاید؛
  // فقط اگر آفلاین بود، نسخهٔ کش‌شده را نشان بده (این باعث می‌شود آپدیت‌های بعدی هم خودکار دیده شوند)
  const isAppShell = e.request.mode === 'navigate' || APP_SHELL.some(p => url.endsWith(p.replace('./', '')) || url.endsWith(p));
  if (isAppShell) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
