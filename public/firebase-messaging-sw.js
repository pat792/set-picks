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

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Setlist Pick Em';
  const options = {
    body: payload?.notification?.body || '',
    icon: '/favicon/web-app-manifest-192x192.png',
    data: payload?.data ?? {},
  };
  self.registration.showNotification(title, options);
});
