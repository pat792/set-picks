/**
 * Cross-feature pending-join status (#728).
 * `usePendingPoolJoin` writes; pools UI subscribes via {@link usePendingPoolJoinStatus}.
 *
 * @typedef {'idle' | 'joining' | 'succeeded' | 'failed'} PendingPoolJoinState
 * @typedef {{
 *   state: PendingPoolJoinState,
 *   inviteCode: string | null,
 *   poolId: string | null,
 *   errorKind: 'timeout' | 'generic' | 'invalid-code' | 'pool-full' | 'pool-archived' | null,
 * }} PendingPoolJoinStatus
 */

/** @type {PendingPoolJoinStatus} */
const IDLE = {
  state: 'idle',
  inviteCode: null,
  poolId: null,
  errorKind: null,
};

/** @type {PendingPoolJoinStatus} */
let status = { ...IDLE };
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(status);
    } catch {
      // ignore listener errors
    }
  });
}

/** @returns {PendingPoolJoinStatus} */
export function getPendingPoolJoinStatus() {
  return status;
}

/**
 * @param {Partial<PendingPoolJoinStatus>} patch
 */
export function setPendingPoolJoinStatus(patch) {
  status = { ...status, ...patch };
  emit();
}

export function resetPendingPoolJoinStatus() {
  status = { ...IDLE };
  emit();
}

/**
 * @param {(next: PendingPoolJoinStatus) => void} listener
 * @returns {() => void}
 */
export function subscribePendingPoolJoinStatus(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
