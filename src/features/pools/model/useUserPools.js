import { useCallback, useEffect, useState } from 'react';

import {
  createPool as createPoolApi,
  fetchPools,
  joinPool as joinPoolApi,
} from '../api/poolsApi';
import { subscribeUserPoolsInvalidate } from './userPoolsRefreshBus';

/**
 * @param {string | undefined} userId
 * @param {{ showDates?: Array<string | { date?: string }> }} [options] Calendar dates used to backfill `pick.pools` after create/join.
 */
export default function useUserPools(userId, options = {}) {
  const { showDates = [] } = options;
  const [pools, setPools] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  /** @type {['join' | 'create' | null, import('react').Dispatch<import('react').SetStateAction<'join' | 'create' | null>>]} */
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const refreshPools = useCallback(async () => {
    if (!userId) {
      setPools([]);
      setError(null);
      return [];
    }

    setListLoading(true);
    setError(null);
    try {
      const nextPools = await fetchPools(userId);
      setPools(nextPools);
      return nextPools;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setListLoading(false);
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
      setActionLoading('create');
      setError(null);
      try {
        const createdPool = await createPoolApi({ userId, name, showDates });
        setPools((prev) => [...prev, createdPool]);
        return createdPool;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [userId, showDates]
  );

  const handleJoin = useCallback(
    async (inviteCode) => {
      setActionLoading('join');
      setError(null);
      try {
        const joinedPool = await joinPoolApi({ userId, inviteCode, showDates });
        setPools((prev) => {
          if (prev.some((pool) => pool.id === joinedPool.id)) return prev;
          return [...prev, joinedPool];
        });
        return joinedPool;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [userId, showDates]
  );

  return {
    pools,
    listLoading,
    actionLoading,
    /** @deprecated Prefer `listLoading` / `actionLoading` (#728). True when either is active. */
    loading: listLoading || actionLoading != null,
    error,
    refreshPools,
    handleCreate,
    handleJoin,
  };
}
