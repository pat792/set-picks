import { useCallback, useEffect, useState } from 'react';

import {
  fetchPoolById,
  fetchPoolMemberProfiles,
} from '../api/poolHubApi';
import {
  trackSharePicksInviteCode,
  trackViewLeaderboardPoolHub,
} from './poolsAnalytics';

export function usePoolHub(poolId, currentUser) {
  const [pool, setPool] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const inviteCode = pool?.inviteCode != null ? String(pool.inviteCode) : '';

  const load = useCallback(async () => {
    if (!poolId?.trim()) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setForbidden(false);
    setPool(null);
    setMembers([]);

    try {
      const poolData = await fetchPoolById(poolId);
      if (!poolData) {
        setNotFound(true);
        return;
      }

      setPool(poolData);

      if (currentUser?.uid && !poolData.members?.includes(currentUser.uid)) {
        setForbidden(true);
        return;
      }

      const profiles = await fetchPoolMemberProfiles(poolId);
      setMembers(profiles);
    } catch (e) {
      console.error('Pool hub load error:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [poolId, currentUser?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || !pool || forbidden || !poolId?.trim()) return;
    trackViewLeaderboardPoolHub({ pool_id: poolId.trim() });
  }, [loading, pool, forbidden, poolId]);

  const handleInviteShareSuccess = useCallback(() => {
    trackSharePicksInviteCode({ pool_id: poolId?.trim() ?? '' });
  }, [poolId]);

  return {
    pool,
    members,
    loading,
    notFound,
    forbidden,
    inviteCode,
    onInviteShareSuccess: handleInviteShareSuccess,
    reload: load,
  };
}
