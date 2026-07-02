/* global importScripts, firebase */

// FCM background service worker shell (issue #273).
// Uses compat in SW for broad browser support.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAJskQFM62Fyr-EjxlGJD3svAhf9gp9CHI',
  authDomain: 'set-picks.firebaseapp.com',
  projectId: 'set-picks',
  storageBucket: 'set-picks.firebasestorage.app',
  messagingSenderId: '927420107250',
  appId: '1:927420107250:web:1b9f52a72ef8dd9096836b',
});

const messaging = firebase.messaging();

const DEFAULT_CLICK_URL = '/dashboard/notifications';

// Registering `onBackgroundMessage` takes over notification display from the
// FCM SDK's own default handler, which means its automatic `fcmOptions.link`
// click-to-open behavior no longer applies either — we have to wire our own
// `notificationclick` listener below and stash the target URL in `data.url`
// ourselves (server sends the link via `webpush.fcmOptions.link`, see
// `functions/fcmMessagingCore.js`).
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Setlist Pick Em';
  const url = payload?.fcmOptions?.link || payload?.data?.url || DEFAULT_CLICK_URL;
  const options = {
    body: payload?.notification?.body || '',
    icon: '/favicon/web-app-manifest-192x192.png',
    data: { ...(payload?.data ?? {}), url },
  };
  self.registration.showNotification(title, options);
});

// Focus an existing Setlist Pick'em tab (navigating it to the target URL) or
// open a new one — without this, tapping/clicking a notification just closes
// it with no navigation.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || DEFAULT_CLICK_URL;
  const targetHref = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            try {
              await client.navigate(targetHref);
            } catch {
              // Cross-origin or unsupported navigate — fall back to focus only.
            }
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetHref);
      }
      return undefined;
    })()
  );
});

// Allow the app shell to trigger skipWaiting so a waiting SW activates
// immediately when the user taps "Reload" in the UpdateAvailableBanner.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
