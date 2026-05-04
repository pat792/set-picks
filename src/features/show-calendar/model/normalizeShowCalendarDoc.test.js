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
      {
        date: '2026-04-16',
        venue: 'Sphere, Las Vegas, NV',
        timeZone: 'America/Los_Angeles',
      },
    ]);
    expect(n?.showDatesByTour).toEqual([
      {
        tour: 'Test Tour',
        shows: [
          {
            date: '2026-04-16',
            venue: 'Sphere, Las Vegas, NV',
            timeZone: 'America/Los_Angeles',
          },
        ],
      },
    ]);
  });

  it('accepts flat showDates only', () => {
    const doc = {
      showDates: [{ date: '2026-04-16', venue: 'Sphere, Las Vegas, NV' }],
    };
    const n = normalizeShowCalendarDoc(doc);
    expect(n?.showDates).toEqual([
      {
        date: '2026-04-16',
        venue: 'Sphere, Las Vegas, NV',
        timeZone: 'America/Los_Angeles',
      },
    ]);
    expect(n?.showDatesByTour?.[0]?.tour).toBe('Scheduled shows');
  });

  it('uses explicit `timeZone` when provided', () => {
    const doc = {
      showDates: [
        {
          date: '2026-06-21',
          venue: 'Royal Albert Hall, London, England',
          timeZone: 'Europe/London',
        },
      ],
    };
    const n = normalizeShowCalendarDoc(doc);
    expect(n?.showDates?.[0]?.timeZone).toBe('Europe/London');
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
