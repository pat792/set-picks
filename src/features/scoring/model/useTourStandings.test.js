import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * #243 cache contract for `useTourStandings`. Same approach as the
 * `useUserSeasonStats` test: assert against `QueryClient` directly so
 * we don't need jsdom or a React renderer in vitest's `node` env.
 *
 * Notable: pool-detail and dashboard Standings intentionally share
 * `['tour-standings', tourKey]` for the same tour, so a session-wide
 * single fetch is the expected behavior.
 */

const TOUR_FALL = [
  { date: '2026-04-23', venue: 'Sphere' },
  { date: '2026-04-24', venue: 'Sphere' },
  { date: '2026-04-26', venue: 'Sphere' },
];
const TOUR_SUMMER = [
  { date: '2026-07-12', venue: 'Alpine' },
  { date: '2026-07-13', venue: 'Alpine' },
];

function tourStandingsKey(tourShows) {
  const dates = Array.isArray(tourShows)
    ? tourShows.map((s) => s?.date).filter(Boolean)
    : [];
  return ['tour-standings', dates.join('|')];
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

describe('useTourStandings — cache contract', () => {
  it('shares one fetch across consumers viewing the same tour', async () => {
    const client = createIsolatedClient();
    const aggregate = vi.fn(async () => [
      { uid: 'a', handle: 'alice', totalPoints: 100, wins: 1, shows: 3 },
    ]);

    // Standings page mount.
    await client.fetchQuery({
      queryKey: tourStandingsKey(TOUR_FALL),
      queryFn: aggregate,
    });
    // Pool-detail page navigates in within the same session.
    const second = await client.fetchQuery({
      queryKey: tourStandingsKey(TOUR_FALL),
      queryFn: aggregate,
    });

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(second[0]).toMatchObject({ uid: 'a', totalPoints: 100 });
  });

  it('busts the cache when the tour changes', async () => {
    const client = createIsolatedClient();
    const aggregate = vi
      .fn()
      .mockResolvedValueOnce([
        { uid: 'a', handle: 'alice', totalPoints: 50, wins: 0, shows: 2 },
      ])
      .mockResolvedValueOnce([
        { uid: 'b', handle: 'bob', totalPoints: 75, wins: 1, shows: 2 },
      ]);

    await client.fetchQuery({
      queryKey: tourStandingsKey(TOUR_FALL),
      queryFn: aggregate,
    });
    const summer = await client.fetchQuery({
      queryKey: tourStandingsKey(TOUR_SUMMER),
      queryFn: aggregate,
    });

    expect(aggregate).toHaveBeenCalledTimes(2);
    expect(summer[0]).toMatchObject({ uid: 'b', totalPoints: 75 });
  });
});
