import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * @param {Array<{ userId?: string } & Record<string, unknown>>} picks
 * @param {import('firebase/auth').User | null | undefined} _user
 * @param {Array<{ id: string; members?: string[]; name?: string }>} userPools
 * @param {string | undefined} navTargetPoolId — from `location.state.targetPoolId` (e.g. Pool Hub CTA)
 */
export function useDisplayedPicks(picks, _user, userPools, navTargetPoolId) {

  const [searchParams, setSearchParams] = useSearchParams();
  const poolIdFromUrl = searchParams.get('poolId')?.trim() || '';

  const [activeFilter, setActiveFilterState] = useState('global');
  const deepLinkConsumedRef = useRef(false);

  const filterOptions = useMemo(() => {
    const poolOptions = (userPools || []).map((p) => ({
      id: p.id,
      label: p.name || 'Pool',
    }));
    return [{ id: 'global', label: 'Everyone' }, ...poolOptions];
  }, [userPools]);

  /** One-shot: prefer router state from Pool Hub over default Global / stale URL. */
  useEffect(() => {
    if (deepLinkConsumedRef.current) return;
    if (!navTargetPoolId?.trim()) return;
    const id = navTargetPoolId.trim();
    if (!userPools?.some((p) => p.id === id)) return;
    deepLinkConsumedRef.current = true;
    setActiveFilterState(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('poolId', id);
        return next;
      },
      { replace: true }
    );
  }, [navTargetPoolId, userPools, setSearchParams]);

  useEffect(() => {
    if (navTargetPoolId?.trim() && userPools?.some((p) => p.id === navTargetPoolId.trim())) {
      return;
    }
    if (!poolIdFromUrl) return;
    if (!userPools?.some((p) => p.id === poolIdFromUrl)) return;
    setActiveFilterState(poolIdFromUrl);
  }, [poolIdFromUrl, userPools, navTargetPoolId]);

  const setActiveFilter = useCallback(
    (filterId) => {
      if (filterId === 'global') {
        setActiveFilterState('global');
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('poolId');
            return next;
          },
          { replace: true }
        );
      } else {
        setActiveFilterState(filterId);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('poolId', filterId);
            return next;
          },
          { replace: true }
        );
      }
    },
    [setSearchParams]
  );

  const displayedPicks = useMemo(() => {
    if (activeFilter === 'global') return picks;

    const selectedPool = userPools?.find((p) => p.id === activeFilter);
    if (!selectedPool) return picks;

    return picks.filter((pick) => selectedPool.members?.includes(pick.userId));
  }, [picks, activeFilter, userPools]);

  return {
    displayedPicks,
    activeFilter,
    setActiveFilter,
    filterOptions,
  };
}
