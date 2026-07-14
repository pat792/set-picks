import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

import { showDatesStatusKey } from './useStandings';

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

describe('showDatesStatusKey', () => {
  it('is stable across new array references with the same membership', () => {
    const a = [
      { date: '2026-07-07', timeZone: 'America/Chicago', venue: 'Kohl' },
      { date: '2026-07-08', timeZone: 'America/Chicago', venue: 'Kohl' },
    ];
    const b = a.map((row) => ({ ...row }));
    expect(showDatesStatusKey(a)).toBe(showDatesStatusKey(b));
  });

  it('changes when a date or timezone changes', () => {
    const a = [{ date: '2026-07-07', timeZone: 'America/Chicago' }];
    const b = [{ date: '2026-07-07', timeZone: 'America/New_York' }];
    expect(showDatesStatusKey(a)).not.toBe(showDatesStatusKey(b));
  });
});

describe('standings-show query cache (#507)', () => {
  it('reuses cached picks+setlist within staleTime for the same showDate', async () => {
    const client = createIsolatedClient();
    const fetchPair = vi.fn(async () => ({
      picks: [{ userId: 'u1', picks: { opener: 'Tweezer' } }],
      actualSetlist: { s1o: 'Tweezer' },
    }));

    await client.fetchQuery({
      queryKey: ['standings-show', '2026-07-07'],
      queryFn: fetchPair,
    });
    const second = await client.fetchQuery({
      queryKey: ['standings-show', '2026-07-07'],
      queryFn: fetchPair,
    });

    expect(fetchPair).toHaveBeenCalledTimes(1);
    expect(second.picks[0].userId).toBe('u1');
  });

  it('busts the cache when showDate changes', async () => {
    const client = createIsolatedClient();
    const fetchPair = vi
      .fn()
      .mockResolvedValueOnce({ picks: [{ userId: 'a' }], actualSetlist: null })
      .mockResolvedValueOnce({ picks: [{ userId: 'b' }], actualSetlist: null });

    await client.fetchQuery({
      queryKey: ['standings-show', '2026-07-07'],
      queryFn: fetchPair,
    });
    const next = await client.fetchQuery({
      queryKey: ['standings-show', '2026-07-08'],
      queryFn: fetchPair,
    });

    expect(fetchPair).toHaveBeenCalledTimes(2);
    expect(next.picks[0].userId).toBe('b');
  });
});
