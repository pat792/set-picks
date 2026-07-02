import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth';
import {
  fetchCommsEmailStatus,
  resubscribeCommsEmail,
  unsubscribeCommsEmail,
} from '../api/commsEmailPrefsApi';

/**
 * @typedef {import('../api/commsEmailPrefsApi').CommsEmailStatus} CommsEmailStatus
 */

const EMPTY_STATUS = /** @type {CommsEmailStatus} */ ({
  ok: false,
  hasEmail: false,
  suppressed: false,
  reason: null,
  canResubscribe: false,
  message: null,
  lifecycleEnabled: true,
});

export function useCommsEmailStatus() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!uid) {
      setStatus(EMPTY_STATUS);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const next = await fetchCommsEmailStatus();
      setStatus(next);
    } catch (e) {
      console.error(e);
      setError('Could not load email status.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unsubscribe = useCallback(async () => {
    if (!uid) return false;
    setWorking(true);
    setError('');
    try {
      await unsubscribeCommsEmail();
      await refresh();
      return true;
    } catch (e) {
      console.error(e);
      setError('Could not unsubscribe from email. Try again.');
      return false;
    } finally {
      setWorking(false);
    }
  }, [refresh, uid]);

  const resubscribe = useCallback(async () => {
    if (!uid) return false;
    setWorking(true);
    setError('');
    try {
      await resubscribeCommsEmail();
      await refresh();
      return true;
    } catch (e) {
      console.error(e);
      setError('Could not re-enable email. Try again.');
      return false;
    } finally {
      setWorking(false);
    }
  }, [refresh, uid]);

  return useMemo(
    () => ({
      status,
      loading,
      working,
      error,
      refresh,
      unsubscribe,
      resubscribe,
    }),
    [error, loading, refresh, resubscribe, status, unsubscribe, working],
  );
}
