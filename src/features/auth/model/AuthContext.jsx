import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '../../../shared/lib/firebase';
import { ensureAppCheckNow } from '../../../shared/lib/firebaseAppCheck';
import {
  fetchUserProfile,
  resolveIsAdmin,
  subscribeToAuthState,
  subscribeToIdTokenChanges,
  subscribeToUserProfile,
} from '../api/authApi';

const AuthContext = createContext(null);

/**
 * Single app-wide auth + profile subscription (#496).
 * Replaces N× `useAuth()` listeners with one provider.
 *
 * #773 Phase 2: seed from `auth.currentUser`, warm App Check on session, and
 * paint profile via `getDoc` before attaching `onSnapshot` (mirror #730).
 * Guards still keep `loading:true` until the first profile result so
 * `loading:false + user + profile:null` cannot flash Almost There (#727).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.currentUser ?? null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let detachProfile = null;

    // Persisted session: warm App Check before auth callback settles (#803).
    // Anonymous cold-open paths stay on deferred init until auth CTA.
    if (auth.currentUser) {
      ensureAppCheckNow();
    }

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

      // Persisted / fresh session — start App Check immediately (#803 / #773).
      ensureAppCheckNow();

      // Guest → sign-in (and user switches): keep guards in `loading` until the
      // first profile result. Otherwise `loading:false + user + profile:null`
      // briefly looks like "needs setup" and dumps returning users onto Almost There (#727).
      setUser(u);
      setUserProfile(null);
      setLoading(true);

      resolveIsAdmin(u)
        .then((flag) => {
          if (!cancelled) setIsAdmin(flag);
        })
        .catch(() => {
          if (!cancelled) setIsAdmin(false);
        });

      try {
        // Fast path: single getDoc before live listener (#773 / #730).
        const initialProfile = await fetchUserProfile(u.uid);
        if (cancelled) return;
        setUserProfile(initialProfile);
        setLoading(false);

        const unsub = await subscribeToUserProfile(
          u.uid,
          (profile) => {
            if (cancelled) return;
            setUserProfile(profile);
          },
          (err) => {
            console.error('AuthProvider profile subscription error:', err);
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
        console.error('AuthProvider profile load failed:', err);
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

  const value = useMemo(
    () => ({ user, userProfile, loading, isAdmin }),
    [user, userProfile, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Session-scoped auth hook. Must be used under `AuthProvider`.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
