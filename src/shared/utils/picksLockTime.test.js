import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PICKS_LOCK_HM,
  formatLockTimeLocalLabel,
  formatLocalHm24,
  lockHmFromDoors,
  parseLocalHm,
  resolvePicksLockHm,
} from './picksLockTime';

describe('parseLocalHm', () => {
  it('parses 24h and 12h strings', () => {
    expect(parseLocalHm('17:30')).toEqual({ hour: 17, minute: 30 });
    expect(parseLocalHm('7:10 PM')).toEqual({ hour: 19, minute: 10 });
    expect(parseLocalHm('12:05 AM')).toEqual({ hour: 0, minute: 5 });
    expect(parseLocalHm('bad')).toBeNull();
  });
});

describe('lockHmFromDoors', () => {
  it('locks doors+100 when avg=119 and safety=19', () => {
    expect(lockHmFromDoors({ hour: 17, minute: 30 })).toEqual({ hour: 19, minute: 10 });
    expect(lockHmFromDoors({ hour: 18, minute: 30 })).toEqual({ hour: 20, minute: 10 });
    expect(lockHmFromDoors({ hour: 17, minute: 0 })).toEqual({ hour: 18, minute: 40 });
  });
});

describe('resolvePicksLockHm (#522)', () => {
  it('uses seeded doors for Merriweather / MSG / Fenway', () => {
    expect(resolvePicksLockHm({ date: '2026-07-18' })).toMatchObject({
      hour: 19,
      minute: 10,
      source: 'doors',
      doorsLocal: '17:30',
    });
    expect(resolvePicksLockHm({ date: '2026-07-22' })).toMatchObject({
      hour: 20,
      minute: 10,
      source: 'doors',
    });
    expect(resolvePicksLockHm({ date: '2026-07-31' })).toMatchObject({
      hour: 18,
      minute: 40,
      source: 'doors',
    });
  });

  it('falls back to 19:30 when doors unknown', () => {
    expect(resolvePicksLockHm({ date: '2099-01-01' })).toEqual({
      ...DEFAULT_PICKS_LOCK_HM,
      source: 'fallback',
      doorsLocal: null,
    });
  });

  it('prefers picksLockLocal then doorsLocal on the show', () => {
    expect(
      resolvePicksLockHm({
        date: '2026-07-18',
        picksLockLocal: '19:40',
        doorsLocal: '17:30',
      })
    ).toMatchObject({ hour: 19, minute: 40, source: 'picksLockLocal' });

    expect(
      resolvePicksLockHm({
        date: '2099-01-01',
        doorsLocal: '18:00',
      })
    ).toMatchObject({ hour: 19, minute: 40, source: 'doors', doorsLocal: '18:00' });
  });

  it('formats labels', () => {
    expect(formatLocalHm24({ hour: 19, minute: 10 })).toBe('19:10');
    expect(formatLockTimeLocalLabel({ hour: 19, minute: 10 })).toBe('7:10 PM');
  });
});
