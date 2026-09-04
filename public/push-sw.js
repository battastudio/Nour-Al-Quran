/* Web Push handlers, imported into the Workbox-generated service worker.
 * The Cloudflare Worker (infra/push-worker) sends payloads shaped as
 * { title, body, url }. */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'نور القرآن', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'نور القرآن';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '#/prayer' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '#/prayer';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.focus();
          if ('navigate' in c) c.navigate(c.url.split('#')[0] + url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
