import { useState, useEffect } from 'react';

import {
  fetchUserProfile,
  resolveIsAdmin,
  subscribeToAuthState,
  subscribeToIdTokenChanges,
} from '../api/authApi';

/**
 * Session-scoped auth hook. Exposes the Firebase user, the Firestore profile
 * doc, a loading flag, and `isAdmin` — resolved from the `admin: true` custom
 * claim (issue #139; PR B made the claim the sole signal). `isAdmin` refreshes
 * whenever the ID token refreshes, so `setAdminClaim` callable writes
 * propagate into the UI without a full re-login (after `getIdTokenResult(true)`).
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (u) => {
      if (u) {
        setUser(u);
        const [profile, adminFlag] = await Promise.all([
          fetchUserProfile(u.uid),
          resolveIsAdmin(u),
        ]);
        setUserProfile(profile);
        setIsAdmin(adminFlag);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
