import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * #243 cache contract: the React Query wrapping in `useUserSeasonStats`
 * must reuse cached results within `staleTime` for the same
 * `(uid, showDatesKey)` and re-run `computeUserSeasonStats` when either
 * piece of the key changes.
 *
 * These tests exercise the cache contract directly against `QueryClient`
 * with the same key shape the hook uses, so they can run in vitest's
 * `node` environment without jsdom or a React renderer.
 */

const SHOWS_A = [{ date: '2026-04-23' }, { date: '2026-04-24' }];
const SHOWS_B = [
  ...SHOWS_A,
  { date: '2026-04-26' },
];

function deriveShowDatesKey(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return '';
  return showDates
    .map((s) => (s && typeof s.date === 'string' ? s.date : ''))
    .filter(Boolean)
    .join('|');
}

function profileSeasonStatsKey(uid, showDates) {
  return ['profile-season-stats', uid, deriveShowDatesKey(showDates)];
}

function createIsolatedClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  });
}

describe('useUserSeasonStats — cache contract', () => {
  it('reuses the cached result for the same uid + showDatesKey within staleTime', async () => {
    const client = createIsolatedClient();
    const compute = vi.fn(async () => ({ totalPoints: 12, shows: 3, wins: 1 }));

    const first = await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-alice', SHOWS_A),
      queryFn: compute,
    });
    const second = await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-alice', SHOWS_A),
      queryFn: compute,
    });

    expect(compute).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ totalPoints: 12, shows: 3, wins: 1 });
    expect(second).toBe(first);
  });

  it('busts the cache and re-runs compute when showDatesKey changes', async () => {
    const client = createIsolatedClient();
    const compute = vi
      .fn()
      .mockResolvedValueOnce({ totalPoints: 4, shows: 1, wins: 0 })
      .mockResolvedValueOnce({ totalPoints: 9, shows: 2, wins: 1 });

    await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-bob', SHOWS_A),
      queryFn: compute,
    });
    const second = await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-bob', SHOWS_B),
      queryFn: compute,
    });

    expect(compute).toHaveBeenCalledTimes(2);
    expect(second).toEqual({ totalPoints: 9, shows: 2, wins: 1 });
  });

  it('busts the cache when uid changes (different users never share)', async () => {
    const client = createIsolatedClient();
    const compute = vi
      .fn()
      .mockResolvedValueOnce({ totalPoints: 1, shows: 1, wins: 0 })
      .mockResolvedValueOnce({ totalPoints: 7, shows: 2, wins: 1 });

    await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-alice', SHOWS_A),
      queryFn: compute,
    });
    await client.fetchQuery({
      queryKey: profileSeasonStatsKey('uid-bob', SHOWS_A),
      queryFn: compute,
    });

    expect(compute).toHaveBeenCalledTimes(2);
  });
});
