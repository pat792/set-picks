import { useCallback, useEffect, useState } from 'react';

/**
 * Detects when a new service worker has installed and is waiting to activate.
 *
 * Usage:
 *   const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
 *
 * `applyUpdate` posts SKIP_WAITING to the waiting worker then reloads the page.
 * The service worker must handle the message and call self.skipWaiting().
 *
 * Works with the existing FCM worker at /firebase-messaging-sw.js which handles
 * the SKIP_WAITING message.
 */
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration = null;

    function onUpdateFound() {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      function onStateChange() {
        // 'installed' + existing controller = waiting to activate (update ready)
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(newWorker);
        }
      }

      newWorker.addEventListener('statechange', onStateChange);
    }

    async function init() {
      try {
        registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) return;

        // Already waiting when the hook mounts (e.g. page was open during deploy)
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          return;
        }

        registration.addEventListener('updatefound', onUpdateFound);
      } catch {
        // Non-critical — silently ignore in environments where SW is unavailable
      }
    }

    init();

    return () => {
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    // Reload once the new SW has claimed the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [waitingWorker]);

  return { updateAvailable: Boolean(waitingWorker), applyUpdate };
}
