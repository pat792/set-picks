import { useState, useEffect } from 'react';

import { fetchUserProfile, subscribeToAuthState } from './api/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (u) => {
      if (u) {
        setUser(u);
        const profile = await fetchUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading };
}