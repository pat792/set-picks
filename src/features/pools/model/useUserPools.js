import { useCallback, useEffect, useState } from 'react';

import {
  createPool as createPoolApi,
  fetchPools,
  joinPool as joinPoolApi,
} from '../api/poolsApi';
import { subscribeUserPoolsInvalidate } from './userPoolsRefreshBus';

export default function useUserPools(userId) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshPools = useCallback(async () => {
    if (!userId) {
      setPools([]);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const nextPools = await fetchPools(userId);
      setPools(nextPools);
      return nextPools;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshPools().catch(() => {});
  }, [refreshPools]);

  useEffect(() => {
    return subscribeUserPoolsInvalidate(() => {
      refreshPools().catch(() => {});
    });
  }, [refreshPools]);

  const handleCreate = useCallback(
    async (name) => {
      setLoading(true);
      setError(null);
      try {
        const createdPool = await createPoolApi({ userId, name });
        setPools((prev) => [...prev, createdPool]);
        return createdPool;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const handleJoin = useCallback(
    async (inviteCode) => {
      setLoading(true);
      setError(null);
      try {
        const joinedPool = await joinPoolApi({ userId, inviteCode });
        setPools((prev) => {
          if (prev.some((pool) => pool.id === joinedPool.id)) return prev;
          return [...prev, joinedPool];
        });
        return joinedPool;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return {
    pools,
    loading,
    error,
    refreshPools,
    handleCreate,
    handleJoin,
  };
}
