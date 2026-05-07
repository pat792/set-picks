import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth';
import {
  mergeNotificationPrefs,
  resolveNotificationPrefs,
  subscribeNotificationPrefs,
} from '../api/notificationPrefsApi';

export function useNotificationPrefs() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [prefs, setPrefs] = useState(() => ({ ...resolveNotificationPrefs(null) }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setPrefs({ ...resolveNotificationPrefs(null) });
      return undefined;
    }
    return subscribeNotificationPrefs(
      uid,
      (next) => setPrefs(next),
      () => {
        setError('Could not load notification preferences.');
      }
    );
  }, [uid]);

  const setField = useCallback(
    async (key, value) => {
      if (!uid) return;
      if (typeof value !== 'boolean') return;
      setIsSaving(true);
      setError('');
      try {
        await mergeNotificationPrefs(uid, { [key]: value });
      } catch (e) {
        console.error(e);
        setError('Could not save preference. Try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [uid]
  );

  return useMemo(
    () => ({
      error,
      isSaving,
      prefs,
      setField,
    }),
    [error, isSaving, prefs, setField]
  );
}
