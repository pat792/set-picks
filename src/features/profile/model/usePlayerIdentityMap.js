import { useQuery } from '@tanstack/react-query';

import { fetchPlayerIdentityMap } from '../api/playerIdentityApi';

/**
 * @param {Iterable<string | null | undefined>} uids
 * @returns {string[]}
 */
export function uniquePlayerUids(uids) {
  const out = [];
  const seen = new Set();
  for (const raw of uids || []) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  out.sort();
  return out;
}

/**
 * Batch-load `avatarId` + `badges` for standings / hub rows (#567 / #568).
 * React Query caches per uid set.
 *
 * @param {Iterable<string | null | undefined>} uids
 */
export function usePlayerIdentityMap(uids) {
  const list = uniquePlayerUids(uids);
  const key = list.join('|');

  const query = useQuery({
    queryKey: ['player-identity-map', key],
    enabled: list.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchPlayerIdentityMap(list),
  });

  return {
    identities: query.data ?? {},
    loading: query.isPending || query.isFetching,
  };
}
