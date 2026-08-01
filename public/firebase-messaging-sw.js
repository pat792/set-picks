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

const DEFAULT_CLICK_URL = '/dashboard/profile/notifications';

/**
 * Same-origin path for SPA soft-nav (#773 Phase 3).
 * Duplicated here (SW cannot import app modules).
 * @param {string} absoluteOrRelativeUrl
 * @returns {string | null}
 */
function appPathFromPushTargetUrl(absoluteOrRelativeUrl) {
  try {
    const url = new URL(absoluteOrRelativeUrl, self.location.origin);
    if (url.origin !== self.location.origin) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

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

// Focus an existing Setlist Pick'em tab and soft-navigate via postMessage, or
// open a new window when none exists (#773 Phase 3). Avoid `client.navigate()`
// on an open SPA tab — that forces a full document reload.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || DEFAULT_CLICK_URL;
  const targetHref = new URL(targetUrl, self.location.origin).href;
  const appPath = appPathFromPushTargetUrl(targetHref) || DEFAULT_CLICK_URL;

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          try {
            client.postMessage({ type: 'NAVIGATE', path: appPath });
          } catch {
            // Older clients without a listener — focus only; user can navigate.
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
