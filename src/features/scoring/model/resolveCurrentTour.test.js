import { describe, expect, it } from 'vitest';

import { resolveCurrentTour } from './resolveCurrentTour';

const tours = [
  {
    tour: 'Spring 2025',
    shows: [
      { date: '2025-03-01', venue: 'A' },
      { date: '2025-03-04', venue: 'B' },
    ],
  },
  {
    tour: 'Summer 2025',
    shows: [
      { date: '2025-07-15', venue: 'C' },
      { date: '2025-07-16', venue: 'D' },
    ],
  },
  {
    tour: 'Fall 2025',
    shows: [
      { date: '2025-11-01', venue: 'E' },
      { date: '2025-12-05', venue: 'F' },
    ],
  },
];

describe('resolveCurrentTour', () => {
  it('returns the tour containing the selected date when possible', () => {
    const result = resolveCurrentTour('2025-07-16', '2025-12-31', tours);
    expect(result?.tour).toBe('Summer 2025');
  });

  it('falls back to the tour containing today when selectedDate is not in any tour', () => {
    const result = resolveCurrentTour('2024-01-01', '2025-11-01', tours);
    expect(result?.tour).toBe('Fall 2025');
  });

  it('falls back to the most recent tour with any finalized shows', () => {
    const result = resolveCurrentTour(null, '2025-08-01', tours);
    // Neither Spring's nor Summer's dates match 2025-08-01 directly, but both
    // have shows <= today. Most recent by last-finalized-date = Summer.
    expect(result?.tour).toBe('Summer 2025');
  });

  it('skips tours whose shows are all in the future', () => {
    const result = resolveCurrentTour(null, '2025-04-01', tours);
    expect(result?.tour).toBe('Spring 2025');
  });

  it('returns null when no tours have finalized shows yet', () => {
    const result = resolveCurrentTour(null, '2024-01-01', tours);
    expect(result).toBe(null);
  });

  it('returns null when the tour list is missing or empty', () => {
    expect(resolveCurrentTour('2025-03-01', '2025-03-01', [])).toBe(null);
    expect(resolveCurrentTour('2025-03-01', '2025-03-01', null)).toBe(null);
  });
});
