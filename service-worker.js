const CACHE_NAME = 'bestdeal-cache-v3'; // увеличили версию
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/feedback.js',
  '/data.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Установка: кладём файлы в кэш
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // сразу активируем новый SW
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim(); // новый SW берёт вкладки под контроль
});

// Отдаём из кэша, либо тянем из сети
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
