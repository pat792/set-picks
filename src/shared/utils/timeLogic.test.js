import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getNextShow,
  getShowStatus,
  isPastPicksLock,
  scheduleTodayYmd,
  shouldRedactOpponentPicksPreLock,
} from './timeLogic';

describe('shouldRedactOpponentPicksPreLock (#303)', () => {
  it('redacts before picks lock / grading when show is still NEXT', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'NEXT')).toBe(true);
    expect(shouldRedactOpponentPicksPreLock(undefined, 'NEXT')).toBe(true);
  });

  it('does not redact once a setlist exists', () => {
    expect(shouldRedactOpponentPicksPreLock({ s1o: 'Fee' }, 'NEXT')).toBe(false);
  });

  it('does not redact after wall-clock lock (LIVE) without setlist yet', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'LIVE')).toBe(false);
  });

  it('does not redact for other statuses', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'PAST')).toBe(false);
    expect(shouldRedactOpponentPicksPreLock(null, 'FUTURE')).toBe(false);
  });
});

describe('venue-local lock + status (#278)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('evaluates lock time in the show timezone instead of fixed PT', () => {
    const at1940Chicago = new Date('2026-07-11T00:40:00.000Z');
    const at1956Chicago = new Date('2026-07-11T00:56:00.000Z');

    expect(isPastPicksLock('2026-07-10', 'America/Chicago', at1940Chicago)).toBe(false);
    expect(isPastPicksLock('2026-07-10', 'America/Chicago', at1956Chicago)).toBe(true);
    expect(isPastPicksLock('2026-07-10', 'America/Los_Angeles', at1956Chicago)).toBe(false);
  });

  it('chooses next show using each show local today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T06:00:00.000Z'));

    const shows = [
      { date: '2026-07-10', venue: 'MSG, New York, NY', timeZone: 'America/New_York' },
      { date: '2026-07-10', venue: 'Hollywood Bowl, Los Angeles, CA', timeZone: 'America/Los_Angeles' },
      { date: '2026-07-11', venue: 'Hollywood Bowl, Los Angeles, CA', timeZone: 'America/Los_Angeles' },
    ];

    expect(getNextShow(shows)).toEqual(shows[1]);
  });

  it('marks a show LIVE at 7:55 in the venue timezone on show date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T00:56:00.000Z'));

    const shows = [
      { date: '2026-07-10', venue: 'Kohl Center, Madison, WI', timeZone: 'America/Chicago' },
    ];

    expect(getShowStatus('2026-07-10', shows)).toBe('LIVE');
  });

  it('keeps fallback venue parsing for old docs without explicit timeZone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T00:56:00.000Z'));

    const shows = [{ date: '2026-07-10', venue: 'Kohl Center, Madison, WI' }];

    expect(getShowStatus('2026-07-10', shows)).toBe('LIVE');
  });

  it('treats DST fall-back repeated local hour as same show date', () => {
    const beforeFallback = new Date('2026-11-01T05:30:00.000Z');
    const afterFallback = new Date('2026-11-01T06:30:00.000Z');

    expect(scheduleTodayYmd('America/New_York', beforeFallback)).toBe('2026-11-01');
    expect(scheduleTodayYmd('America/New_York', afterFallback)).toBe('2026-11-01');
  });
});
