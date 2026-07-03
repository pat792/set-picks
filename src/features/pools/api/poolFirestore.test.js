import { describe, expect, it } from 'vitest';

import {
  STANDINGS_SCOPE_FROM_MEMBERSHIP,
  memberJoinedOnForUser,
  membershipCalendarDay,
  pickDataCountsForPool,
} from './poolFirestore';

describe('membershipCalendarDay', () => {
  it('returns YYYY-MM-DD in America/Los_Angeles', () => {
    // 2026-07-03T08:00:00Z is still Jul 3 in LA (UTC-7).
    expect(membershipCalendarDay('2026-07-03T08:00:00.000Z')).toBe('2026-07-03');
  });

  it('returns null for invalid input', () => {
    expect(membershipCalendarDay(null)).toBe(null);
    expect(membershipCalendarDay('not-a-date')).toBe(null);
  });
});

describe('pickDataCountsForPool — legacy (default)', () => {
  it('rejects empty inputs', () => {
    expect(pickDataCountsForPool(null, 'p1')).toBe(false);
    expect(pickDataCountsForPool({}, '')).toBe(false);
  });

  it('counts legacy picks (no pools snapshot) everywhere', () => {
    expect(pickDataCountsForPool({ picks: { s1: 'Foo' } }, 'p1')).toBe(true);
    expect(pickDataCountsForPool({ pools: [] }, 'p1')).toBe(true);
  });

  it('scopes embedded pools snapshot to id match', () => {
    const data = { pools: [{ id: 'p1' }, { id: 'p2' }] };
    expect(pickDataCountsForPool(data, 'p1')).toBe(true);
    expect(pickDataCountsForPool(data, 'p3')).toBe(false);
  });
});

describe('pickDataCountsForPool — from_membership (#417)', () => {
  const ctx = (overrides = {}) => ({
    standingsScope: STANDINGS_SCOPE_FROM_MEMBERSHIP,
    memberJoinedOn: '2026-07-03',
    showDate: '2026-07-05',
    ...overrides,
  });

  it('requires explicit pools snapshot (no legacy empty-pools fallback)', () => {
    expect(
      pickDataCountsForPool({ picks: { s1: 'Foo' } }, 'p1', ctx()),
    ).toBe(false);
    expect(pickDataCountsForPool({ pools: [] }, 'p1', ctx())).toBe(false);
  });

  it('includes picks on/after membership day when pool is in snapshot', () => {
    const data = { pools: [{ id: 'p1' }], showDate: '2026-07-05' };
    expect(pickDataCountsForPool(data, 'p1', ctx())).toBe(true);
    expect(
      pickDataCountsForPool(data, 'p1', ctx({ showDate: '2026-07-03' })),
    ).toBe(true);
  });

  it('excludes picks before membership day', () => {
    const data = { pools: [{ id: 'p1' }] };
    expect(
      pickDataCountsForPool(data, 'p1', ctx({ showDate: '2026-07-02' })),
    ).toBe(false);
  });

  it('excludes picks that list other pools only', () => {
    const data = { pools: [{ id: 'p2' }] };
    expect(pickDataCountsForPool(data, 'p1', ctx())).toBe(false);
  });

  it('excludes when membership day is missing', () => {
    const data = { pools: [{ id: 'p1' }] };
    expect(
      pickDataCountsForPool(data, 'p1', ctx({ memberJoinedOn: null })),
    ).toBe(false);
  });

  it('uses pickData.showDate when ctx.showDate omitted', () => {
    const data = { pools: [{ id: 'p1' }], showDate: '2026-07-10' };
    expect(
      pickDataCountsForPool(data, 'p1', {
        standingsScope: STANDINGS_SCOPE_FROM_MEMBERSHIP,
        memberJoinedOn: '2026-07-03',
      }),
    ).toBe(true);
  });
});

describe('memberJoinedOnForUser', () => {
  it('resolves calendar day from memberJoinedAt map', () => {
    expect(
      memberJoinedOnForUser(
        { u1: '2026-07-03T18:00:00.000Z' },
        'u1',
      ),
    ).toBe('2026-07-03');
    expect(memberJoinedOnForUser({ u1: '2026-07-03T18:00:00.000Z' }, 'u2')).toBe(
      null,
    );
  });
});
