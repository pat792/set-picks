import { useEffect, useState } from 'react';

import {
  fetchPoolsForMember,
  fetchPublicProfileByUid,
} from '../api/publicProfileApi';

/**
 * Loads another user's public profile and their pool memberships for display.
 * @param {string|undefined} uid
 * @returns {{ loading: boolean, error: 'missing'|'notfound'|'fetch'|null, profile: object|null, userPools: object[] }}
 */
export function usePublicProfile(uid) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userPools, setUserPools] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!uid?.trim()) {
        setLoading(false);
        setError('missing');
        setProfile(null);
        setUserPools([]);
        return;
      }

      setLoading(true);
      setError(null);
      setProfile(null);
      setUserPools([]);

      try {
        const profileData = await fetchPublicProfileByUid(uid);
        if (cancelled) return;

        if (!profileData) {
          setError('notfound');
          setProfile(null);
          setUserPools([]);
        } else {
          setProfile(profileData);
          setError(null);

          const pools = await fetchPoolsForMember(uid);
          if (cancelled) return;
          setUserPools(pools);
        }
      } catch (e) {
        console.error('PublicProfile load error:', e);
        if (!cancelled) {
          setError('fetch');
          setProfile(null);
          setUserPools([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { loading, error, profile, userPools };
}
