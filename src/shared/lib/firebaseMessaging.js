import { app } from './firebase';

let fcmModulePromise = null;
let swRegistrationPromise = null;

function getVapidKey() {
  const value = import.meta.env.VITE_FCM_VAPID_KEY;
  if (typeof value !== 'string') return '';
  return value.trim();
}

function loadMessagingModule() {
  if (!fcmModulePromise) {
    fcmModulePromise = import('firebase/messaging');
  }
  return fcmModulePromise;
}

async function getMessagingClient() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }

  const mod = await loadMessagingModule();
  const supported = await mod.isSupported();
  if (!supported) return null;

  const registration = await registerMessagingServiceWorker();
  const messaging = mod.getMessaging(app);
  return { mod, messaging, registration };
}

export async function registerMessagingServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
  }
  return swRegistrationPromise;
}

export async function requestFcmDeviceToken() {
  const vapidKey = getVapidKey();
  if (!vapidKey) {
    throw new Error('Missing VITE_FCM_VAPID_KEY');
  }

  const client = await getMessagingClient();
  if (!client) return null;

  const token = await client.mod.getToken(client.messaging, {
    vapidKey,
    serviceWorkerRegistration: client.registration,
  });

  return token || null;
}

export async function refreshFcmDeviceToken() {
  const vapidKey = getVapidKey();
  if (!vapidKey) {
    throw new Error('Missing VITE_FCM_VAPID_KEY');
  }

  const client = await getMessagingClient();
  if (!client) return null;

  // Force a remint when sender credentials or VAPID configuration changes.
  try {
    await client.mod.deleteToken(client.messaging);
  } catch {
    // Ignore delete failures and still attempt to mint a new token.
  }

  const token = await client.mod.getToken(client.messaging, {
    vapidKey,
    serviceWorkerRegistration: client.registration,
  });

  return token || null;
}

export async function revokeFcmDeviceToken() {
  const client = await getMessagingClient();
  if (!client) return false;
  try {
    await client.mod.deleteToken(client.messaging);
    return true;
  } catch {
    return false;
  }
}

export async function subscribeForegroundFcmMessages(onPayload) {
  const client = await getMessagingClient();
  if (!client) return () => {};
  return client.mod.onMessage(client.messaging, onPayload);
}
