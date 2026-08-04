import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  ensureFirebase,
  requestAuthBoot,
  shouldDeferFirebaseBoot,
  waitForAuthBootRequest,
} from '../../../shared/lib/ensureFirebase';
import {
  clearPersistedSessionHint,
  hasPersistedSessionHint,
  markPersistedSession,
} from '../../../shared/lib/persistedSessionHint';
import { peekGoogleRedirectIntent } from '../utils/googleRedirectIntent';

const AuthContext = createContext(null);

function readBootPathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '';
}

function shouldDeferAuthProviderBoot() {
  return shouldDeferFirebaseBoot(readBootPathname(), {
    hasSession: hasPersistedSessionHint(),
    hasRedirectIntent: Boolean(peekGoogleRedirectIntent()),
  });
}

/**
 * Single app-wide auth + profile subscription (#496).
 * Replaces N× `useAuth()` listeners with one provider.
 *
 * #773 Phase 2: seed from `auth.currentUser`, warm App Check on session, and
 * paint profile via `getDoc` before attaching `onSnapshot` (mirror #730).
 * Guards still keep `loading:true` until the first profile result so
 * `loading:false + user + profile:null` cannot flash Almost There (#727).
 *
 * #835: anon `/login` defers Firebase until {@link ensureAuthReady} (CTA /
 * Google redirect). Form paints with `loading:false` + `user:null`.
 */
export function AuthProvider({ children }) {
  const [deferBoot] = useState(() => shouldDeferAuthProviderBoot());
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(() => !deferBoot);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let detachProfile = null;
    let unsubscribeAuth = () => {};
    let unsubscribeToken = () => {};

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

    (async () => {
      if (deferBoot) {
        // Form can paint; wait for Sign in / Create account (or redirect wake).
        await waitForAuthBootRequest();
        if (cancelled) return;
        setLoading(true);
      } else {
        requestAuthBoot();
      }

      const { auth } = await ensureFirebase();
      if (cancelled) return;

      const {
        fetchUserProfile,
        resolveIsAdmin,
        subscribeToAuthState,
        subscribeToIdTokenChanges,
        subscribeToUserProfile,
      } = await import('../api/authApi');
      const { ensureAppCheckNow } = await import(
        '../../../shared/lib/firebaseAppCheck'
      );

      // Persisted session: warm App Check before auth callback settles (#803).
      if (auth.currentUser) {
        ensureAppCheckNow();
        markPersistedSession();
        setUser(auth.currentUser);
      }

      unsubscribeAuth = subscribeToAuthState(async (u) => {
        stopProfileListener();

        if (cancelled) return;

        if (!u) {
          // Next cold open on `/` is anonymous — stop prefetching the dashboard (#804).
          clearPersistedSessionHint();
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Persisted / fresh session — start App Check immediately (#803 / #773).
        ensureAppCheckNow();
        markPersistedSession();

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

      unsubscribeToken = subscribeToIdTokenChanges(async (u) => {
        if (!u) {
          setIsAdmin(false);
          return;
        }
        const adminFlag = await resolveIsAdmin(u);
        if (!cancelled) setIsAdmin(adminFlag);
      });
    })();

    return () => {
      cancelled = true;
      stopProfileListener();
      try {
        unsubscribeAuth();
      } catch {
        // ignore
      }
      try {
        unsubscribeToken();
      } catch {
        // ignore
      }
    };
  }, [deferBoot]);

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
