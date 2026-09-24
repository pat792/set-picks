import { describe, expect, it } from 'vitest';

import { TOUR_RECAP_INAPP_CTA } from './TourRecapInApp.jsx';

describe('TOUR_RECAP_INAPP_CTA', () => {
  it('closes the loop to Tour standings after the inbox recap', () => {
    expect(TOUR_RECAP_INAPP_CTA.label).toBe('View tour standings');
    expect(TOUR_RECAP_INAPP_CTA.href).toBe('/dashboard/standings?view=tour');
  });
});
