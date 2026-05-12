import { useState, useEffect } from 'react';

import {
  resolveIsAdmin,
  subscribeToAuthState,
  subscribeToIdTokenChanges,
  subscribeToUserProfile,
} from '../api/authApi';

/**
 * Session-scoped auth hook. Exposes the Firebase user, the Firestore
 * profile doc, a loading flag, and `isAdmin` — resolved from the
 * `admin: true` custom claim (issue #139; PR B made the claim the sole
 * signal). `isAdmin` refreshes whenever the ID token refreshes, so
 * `setAdminClaim` callable writes propagate into the UI without a full
 * re-login (after `getIdTokenResult(true)`).
 *
 * The profile doc is **subscribed via `onSnapshot`**, not one-shot read
 * (PR-4 of the May 2026 post-mortem). That makes the route guards
 * self-healing — `SetupRoute` now redirects to dashboard automatically
 * the moment `createInitialUserProfile` writes the `handle` field, with
 * no full-page reload required.
 */
export function useAuth() {
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
      // Always detach the previous listener before reacting to a new
      // auth state. Otherwise sign-out / account-switch would leak a
      // snapshot listener pointed at the prior uid.
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

      // Admin claim resolves independently of profile doc; fire in
      // parallel so a slow Firestore subscription doesn't delay the
      // initial admin-flag flip.
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
            // Drop to null so guards route to /setup or /; do not leave a
            // stale profile around after a permission / network fault.
            setUserProfile(null);
            setLoading(false);
          }
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
    // Track ID token refreshes separately so a freshly-granted admin claim
    // (from `setAdminClaim`) flips `isAdmin` without requiring a full re-auth.
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
