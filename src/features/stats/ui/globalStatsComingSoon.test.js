import { describe, expect, it } from 'vitest';

import {
  GLOBAL_STATS_COMING_SOON_BODY,
  GLOBAL_STATS_COMING_SOON_TITLE,
} from './GlobalStatsComingSoon';

describe('Global Stats coming-soon copy (#1004)', () => {
  it('is a rankings shell that points players at Band', () => {
    expect(GLOBAL_STATS_COMING_SOON_TITLE).toMatch(/coming soon/i);
    expect(GLOBAL_STATS_COMING_SOON_TITLE).toMatch(/ranking/i);
    expect(GLOBAL_STATS_COMING_SOON_BODY).toMatch(/Band/i);
    expect(GLOBAL_STATS_COMING_SOON_BODY).toMatch(/Personal/i);
    expect(GLOBAL_STATS_COMING_SOON_BODY).not.toMatch(/#300/);
  });
});
