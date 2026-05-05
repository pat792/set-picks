import { describe, expect, it } from 'vitest';

import { resolveShowTimeZone } from './showTimeZone';

describe('resolveShowTimeZone', () => {
  it('prefers explicit timeZone field', () => {
    expect(
      resolveShowTimeZone({
        venue: 'Any Venue',
        timeZone: 'Europe/London',
      })
    ).toBe('Europe/London');
  });

  it('infers zone from US state in venue line', () => {
    expect(resolveShowTimeZone({ venue: 'Kohl Center, Madison, WI' })).toBe(
      'America/Chicago'
    );
    expect(resolveShowTimeZone({ venue: 'MSG, New York, NY' })).toBe(
      'America/New_York'
    );
  });

  it('infers non-US fallback patterns', () => {
    expect(
      resolveShowTimeZone({ venue: 'Moon Palace, Cancun, Quintana Roo, Mexico' })
    ).toBe('America/Cancun');
    expect(
      resolveShowTimeZone({ venue: 'Royal Albert Hall, London, England' })
    ).toBe('Europe/London');
  });
});
