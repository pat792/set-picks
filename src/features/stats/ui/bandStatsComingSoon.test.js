import { describe, expect, it } from 'vitest';

import {
  BAND_STATS_COMING_SOON_BODY,
  BAND_STATS_COMING_SOON_TITLE,
} from './BandStatsComingSoon';

describe('Band Stats coming-soon copy (#769)', () => {
  it('is a shell that points players at Global', () => {
    expect(BAND_STATS_COMING_SOON_TITLE).toMatch(/coming soon/i);
    expect(BAND_STATS_COMING_SOON_BODY).toMatch(/Global/i);
    expect(BAND_STATS_COMING_SOON_BODY).not.toMatch(/#300/);
  });
});
