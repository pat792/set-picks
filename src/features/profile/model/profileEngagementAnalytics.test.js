import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
}));

import { ga4Event } from '../../../shared/lib/ga4';
import {
  trackAvatarChanged,
  trackBadgePinChanged,
  trackBadgeShelfView,
} from './profileEngagementAnalytics.js';

describe('profileEngagementAnalytics', () => {
  beforeEach(() => {
    ga4Event.mockClear();
  });

  it('trackAvatarChanged emits avatar_id', () => {
    trackAvatarChanged({ avatar_id: 'disc' });
    expect(ga4Event).toHaveBeenCalledWith('avatar_changed', {
      avatar_id: 'disc',
    });
  });

  it('trackBadgeShelfView normalizes surface and count', () => {
    trackBadgeShelfView({ surface: 'public_profile', badge_count: 3 });
    expect(ga4Event).toHaveBeenCalledWith('badge_shelf_view', {
      surface: 'public_profile',
      badge_count: 3,
    });

    trackBadgeShelfView({ surface: 'other', badge_count: -1 });
    expect(ga4Event).toHaveBeenLastCalledWith('badge_shelf_view', {
      surface: 'profile',
      badge_count: 0,
    });
  });

  it('trackBadgePinChanged defaults action to pin', () => {
    trackBadgePinChanged({ badge_id: 'win_1', action: 'unpin' });
    expect(ga4Event).toHaveBeenCalledWith('badge_pin_changed', {
      badge_id: 'win_1',
      action: 'unpin',
    });

    trackBadgePinChanged({ badge_id: 'shows_played_1' });
    expect(ga4Event).toHaveBeenLastCalledWith('badge_pin_changed', {
      badge_id: 'shows_played_1',
      action: 'pin',
    });
  });
});
