import { describe, expect, it } from 'vitest';

import {
  GAME_LAUNCH_SHOW_DATE,
  floorShowsAtGameLaunch,
} from './gameLaunch';

describe('floorShowsAtGameLaunch', () => {
  it('drops shows that pre-date the launch floor', () => {
    const shows = [
      { date: '2025-09-12', venue: 'Pre-launch venue' },
      { date: '2025-12-31', venue: 'NYE 2025' },
      { date: GAME_LAUNCH_SHOW_DATE, venue: 'Opening night' },
      { date: '2026-04-17', venue: 'Night two' },
    ];
    expect(floorShowsAtGameLaunch(shows)).toEqual([
      { date: GAME_LAUNCH_SHOW_DATE, venue: 'Opening night' },
      { date: '2026-04-17', venue: 'Night two' },
    ]);
  });

  it('keeps the launch date itself (boundary is inclusive)', () => {
    expect(
      floorShowsAtGameLaunch([{ date: GAME_LAUNCH_SHOW_DATE }])
    ).toEqual([{ date: GAME_LAUNCH_SHOW_DATE }]);
  });

  it('returns an empty array when input is null/undefined or non-iterable', () => {
    expect(floorShowsAtGameLaunch(null)).toEqual([]);
    expect(floorShowsAtGameLaunch(undefined)).toEqual([]);
  });

  it('skips entries that are missing or have non-string dates', () => {
    expect(
      floorShowsAtGameLaunch([
        null,
        undefined,
        { date: '' },
        { date: 12345 },
        { date: '2026-04-20' },
      ])
    ).toEqual([{ date: '2026-04-20' }]);
  });

  it('preserves all extra fields on each show entry', () => {
    const show = { date: '2026-05-01', venue: 'Venue A', extra: 'x' };
    expect(floorShowsAtGameLaunch([show])).toEqual([show]);
  });
});
