/**
 * Cross-hook sync: notify mounted {@link useUserPools} instances to refetch
 * (e.g. after deferred invite join). If nothing is subscribed yet, the next
 * subscriber runs a refresh once (covers navigate to /pools after join).
 */
const listeners = new Set();

let pendingInvalidate = false;

export function subscribeUserPoolsInvalidate(listener) {
  listeners.add(listener);
  if (pendingInvalidate) {
    pendingInvalidate = false;
    queueMicrotask(() => {
      try {
        listener();
      } catch {
        // ignore
      }
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

export function invalidateUserPools() {
  if (listeners.size === 0) {
    pendingInvalidate = true;
    return;
  }
  pendingInvalidate = false;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // listener errors should not break other subscribers
    }
  });
}
