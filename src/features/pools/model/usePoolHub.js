import { useCallback, useEffect, useState } from 'react';

import {
  fetchPoolById,
  fetchPoolMemberProfiles,
} from '../api/poolHubApi';

export function usePoolHub(poolId, currentUser) {
  const [pool, setPool] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return {
    pool,
    members,
    loading,
    notFound,
    forbidden,
    handleCopyCode,
    copied,
  };
}
