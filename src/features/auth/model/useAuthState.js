import { useState, useEffect } from 'react';

import {
  resolveIsAdmin,
  subscribeToAuthState,
  subscribeToIdTokenChanges,
  subscribeToUserProfile,
} from '../api/authApi';

/**
 * Internal session hook — consumed only by {@link AuthProvider}.
 * Exposes the Firebase user, the Firestore profile doc, a loading flag, and
 * `isAdmin` — resolved from the `admin: true` custom claim (issue #139).
 *
 * The profile doc is subscribed via `onSnapshot`, not one-shot read, so route
 * guards self-heal when setup completes without a full-page reload.
 */
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let detachProfile = null;

    const stopProfileListener = () => {
      if (typeof detachProfile === 'function') {
        try {
          detachProfile();
        } catch {
          // Best-effort teardown; SDK occasionally throws on double-unsub.
        }
      }
      detachProfile = null;
    };

    const unsubscribeAuth = subscribeToAuthState(async (u) => {
      stopProfileListener();

      if (cancelled) return;

      if (!u) {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(u);

      resolveIsAdmin(u)
        .then((flag) => {
          if (!cancelled) setIsAdmin(flag);
        })
        .catch(() => {
          if (!cancelled) setIsAdmin(false);
        });

      try {
        const unsub = await subscribeToUserProfile(
          u.uid,
          (profile) => {
            if (cancelled) return;
            setUserProfile(profile);
            setLoading(false);
          },
          (err) => {
            console.error('useAuth profile subscription error:', err);
            if (cancelled) return;
            setUserProfile(null);
            setLoading(false);
          },
        );

        if (cancelled) {
          try {
            unsub();
          } catch {
            // ignore
          }
          return;
        }

        detachProfile = unsub;
      } catch (err) {
        console.error('useAuth profile subscribe failed:', err);
        if (!cancelled) {
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      stopProfileListener();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToIdTokenChanges(async (u) => {
      if (!u) {
        setIsAdmin(false);
        return;
      }
      const adminFlag = await resolveIsAdmin(u);
      setIsAdmin(adminFlag);
    });
    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading, isAdmin };
}
