import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detects when a new service worker has installed and is waiting to activate.
 *
 * Usage:
 *   const { updateAvailable, applyUpdate, isApplyingUpdate } = useServiceWorkerUpdate();
 *
 * `applyUpdate` posts SKIP_WAITING to the waiting worker then reloads the page.
 * The service worker must handle the message and call self.skipWaiting().
 *
 * Works with the existing FCM worker at /firebase-messaging-sw.js which handles
 * the SKIP_WAITING message.
 */
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const waitingWorkerRef = useRef(null);

  useEffect(() => {
    waitingWorkerRef.current = waitingWorker;
  }, [waitingWorker]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration = null;
    let cancelled = false;

    function onUpdateFound() {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      function onStateChange() {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(newWorker);
        }
      }

      newWorker.addEventListener('statechange', onStateChange);
    }

    async function init() {
      try {
        registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration || cancelled) return;

        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          return;
        }

        registration.addEventListener('updatefound', onUpdateFound);
      } catch {
        // Non-critical — silently ignore in environments where SW is unavailable
      }
    }

    // Defer SW inspection until after first paint — Safari can stall boot when
    // update checks compete with auth/Firestore on the main thread.
    let idleId = null;
    let timeoutId = null;
    const start = () => {
      if (!cancelled) init();
    };
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      timeoutId = setTimeout(start, 500);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    const worker = waitingWorkerRef.current;
    if (!worker || isApplyingUpdate) return;

    setIsApplyingUpdate(true);

    const reload = () => {
      window.location.reload();
    };

    // Safari often never fires controllerchange unless the SW calls clients.claim().
    // Keep a hard fallback so "Reload" never appears to hang indefinitely.
    const fallbackTimer = setTimeout(reload, 2000);

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        clearTimeout(fallbackTimer);
        reload();
      },
      { once: true },
    );

    worker.postMessage({ type: 'SKIP_WAITING' });
  }, [isApplyingUpdate]);

  return {
    updateAvailable: Boolean(waitingWorker),
    applyUpdate,
    isApplyingUpdate,
  };
}
