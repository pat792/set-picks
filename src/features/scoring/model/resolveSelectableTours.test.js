import { describe, expect, it } from 'vitest';

import { getTourByKey, resolveSelectableTours } from './resolveSelectableTours';

// GAME_LAUNCH_SHOW_DATE = '2026-04-16'
const TOURS = [
  {
    tour: 'Sphere Run',
    shows: [
      { date: '2024-04-20', venue: 'Sphere' },
      { date: '2024-04-26', venue: 'Sphere' },
    ],
  },
  {
    tour: 'Spring Tour 2026',
    shows: [
      { date: '2026-04-16', venue: 'A' },
      { date: '2026-04-18', venue: 'B' },
      { date: '2026-04-20', venue: 'C' },
    ],
  },
  {
    tour: 'Summer Tour 2026',
    shows: [
      { date: '2026-07-01', venue: 'D' },
      { date: '2026-07-02', venue: 'E' },
    ],
  },
  {
    tour: 'Fall Tour 2026',
    shows: [{ date: '2026-10-01', venue: 'F' }],
  },
];

describe('resolveSelectableTours', () => {
  it('returns only tours with post-launch shows on or before today', () => {
    const result = resolveSelectableTours(TOURS, '2026-07-15');
    const names = result.map((t) => t.tour);
    expect(names).toContain('Spring Tour 2026');
    expect(names).toContain('Summer Tour 2026');
    expect(names).not.toContain('Sphere Run');
    expect(names).not.toContain('Fall Tour 2026');
  });

  it('sorts by newest last-show-date first', () => {
    const result = resolveSelectableTours(TOURS, '2026-07-15');
    expect(result[0].tour).toBe('Summer Tour 2026');
    expect(result[1].tour).toBe('Spring Tour 2026');
  });

  it('includes a tour whose only qualifying show is exactly today', () => {
    const result = resolveSelectableTours(TOURS, '2026-07-01');
    expect(result.map((t) => t.tour)).toContain('Summer Tour 2026');
  });

  it('excludes a tour whose qualifying shows are all in the future', () => {
    const result = resolveSelectableTours(TOURS, '2026-06-30');
    expect(result.map((t) => t.tour)).not.toContain('Summer Tour 2026');
  });

  it('excludes pre-launch tours even when their shows are before today', () => {
    const result = resolveSelectableTours(TOURS, '2026-07-15');
    expect(result.map((t) => t.tour)).not.toContain('Sphere Run');
  });

  it('uses the last qualifying show date for sort ordering, not the overall last show', () => {
    const tours = [
      {
        tour: 'Tour A',
        shows: [
          { date: '2026-05-01', venue: 'X' },
          { date: '2026-08-01', venue: 'Y' },
        ],
      },
      {
        tour: 'Tour B',
        shows: [{ date: '2026-06-01', venue: 'Z' }],
      },
    ];
    // today = 2026-07-01 → Tour A's qualifying shows go up to 2026-05-01;
    // Tour B's qualifying shows go up to 2026-06-01 → Tour B should lead.
    const result = resolveSelectableTours(tours, '2026-07-01');
    expect(result[0].tour).toBe('Tour B');
    expect(result[1].tour).toBe('Tour A');
  });

  it('returns empty array for null input', () => {
    expect(resolveSelectableTours(null, '2026-07-15')).toEqual([]);
  });

  it('returns empty array for empty showDatesByTour', () => {
    expect(resolveSelectableTours([], '2026-07-15')).toEqual([]);
  });

  it('returns empty array when today is empty', () => {
    expect(resolveSelectableTours(TOURS, '')).toEqual([]);
  });

  it('returns empty array when no tours have qualifying shows', () => {
    expect(resolveSelectableTours(TOURS, '2026-04-15')).toEqual([]);
  });
});

describe('getTourByKey', () => {
  it('finds a tour by exact name', () => {
    const result = getTourByKey(TOURS, 'Spring Tour 2026');
    expect(result?.tour).toBe('Spring Tour 2026');
  });

  it('normalizes surrounding whitespace', () => {
    const result = getTourByKey(TOURS, '  Spring Tour 2026  ');
    expect(result?.tour).toBe('Spring Tour 2026');
  });

  it('returns null for an unknown key', () => {
    expect(getTourByKey(TOURS, 'Unknown Tour')).toBeNull();
  });

  it('returns null for null showDatesByTour', () => {
    expect(getTourByKey(null, 'Spring Tour 2026')).toBeNull();
  });

  it('returns null for null tourKey', () => {
    expect(getTourByKey(TOURS, null)).toBeNull();
  });

  it('returns null for empty string tourKey', () => {
    expect(getTourByKey(TOURS, '')).toBeNull();
  });

  it('returns null for whitespace-only tourKey', () => {
    expect(getTourByKey(TOURS, '   ')).toBeNull();
  });
});
