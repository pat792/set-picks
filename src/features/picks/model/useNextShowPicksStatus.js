import { useEffect, useState } from 'react';

import { useAuth } from '../../auth';
import { hasSubmittedPicksForShow } from '../api/picksApi';

/**
 * Live Firestore status: whether the signed-in user has submitted picks for a given show date.
 *
 * @param {string} [showDate] — YYYY-MM-DD for the target show (e.g. next pickable show).
 * @returns {{ hasSubmittedPicksForNextShow: boolean, loading: boolean, error: string | null }}
 */
export function useNextShowPicksStatus(showDate) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubmittedPicksForNextShow, setHasSubmittedPicksForNextShow] =
    useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!showDate || !user?.uid) {
        if (!cancelled) {
          setHasSubmittedPicksForNextShow(false);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const submitted = await hasSubmittedPicksForShow(showDate, user.uid);
        if (!cancelled) {
          setHasSubmittedPicksForNextShow(submitted);
        }
      } catch (err) {
        console.error('useNextShowPicksStatus:', err);
        if (!cancelled) {
          setHasSubmittedPicksForNextShow(false);
          setError(
            err?.message != null
              ? String(err.message)
              : 'Failed to load picks status.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [showDate, user?.uid, authLoading]);

  return { hasSubmittedPicksForNextShow, loading, error };
}
