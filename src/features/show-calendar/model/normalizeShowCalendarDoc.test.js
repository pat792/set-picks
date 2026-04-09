import { describe, expect, it } from 'vitest';

import { normalizeShowCalendarDoc } from './normalizeShowCalendarDoc.js';

describe('normalizeShowCalendarDoc', () => {
  it('returns null for empty input', () => {
    expect(normalizeShowCalendarDoc(null)).toBeNull();
    expect(normalizeShowCalendarDoc(undefined)).toBeNull();
  });

  it('accepts showDatesByTour shape', () => {
    const doc = {
      showDatesByTour: [
        {
          tour: 'Test Tour',
          shows: [{ date: '2026-04-16', venue: 'Sphere, Las Vegas, NV' }],
        },
      ],
    };
    const n = normalizeShowCalendarDoc(doc);
    expect(n?.showDates).toEqual([
      { date: '2026-04-16', venue: 'Sphere, Las Vegas, NV' },
    ]);
    expect(n?.showDatesByTour).toEqual(doc.showDatesByTour);
  });

  it('accepts flat showDates only', () => {
    const doc = {
      showDates: [{ date: '2026-04-16', venue: 'Sphere, Las Vegas, NV' }],
    };
    const n = normalizeShowCalendarDoc(doc);
    expect(n?.showDates).toEqual(doc.showDates);
    expect(n?.showDatesByTour?.[0]?.tour).toBe('Scheduled shows');
  });

  it('rejects bad dates', () => {
    expect(
      normalizeShowCalendarDoc({
        showDatesByTour: [
          { tour: 'X', shows: [{ date: 'not-a-date', venue: 'V' }] },
        ],
      })
    ).toBeNull();
  });
});
