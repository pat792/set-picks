import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * @param {Array<{ userId?: string } & Record<string, unknown>>} picks
 * @param {import('firebase/auth').User | null | undefined} _user
 * @param {Array<{ id: string; members?: string[]; name?: string }>} userPools
 */
export function useDisplayedPicks(picks, _user, userPools) {

  const [searchParams, setSearchParams] = useSearchParams();
  const poolIdFromUrl = searchParams.get('poolId')?.trim() || '';

  const [activeFilter, setActiveFilterState] = useState('global');

  const filterOptions = useMemo(() => {
    const poolOptions = (userPools || []).map((p) => ({
      id: p.id,
      label: p.name || 'Pool',
    }));
    return [{ id: 'global', label: 'Global' }, ...poolOptions];
  }, [userPools]);

  useEffect(() => {
    if (!poolIdFromUrl) return;
    if (!userPools?.some((p) => p.id === poolIdFromUrl)) return;
    setActiveFilterState(poolIdFromUrl);
  }, [poolIdFromUrl, userPools]);

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
