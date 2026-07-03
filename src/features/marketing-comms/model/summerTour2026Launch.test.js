import { describe, expect, it } from 'vitest';
import {
  SUMMER_TOUR_2026_LAUNCH_CAMPAIGN_ID,
  SUMMER_TOUR_2026_LAUNCH_TEMPLATE_ID,
  SUMMER_TOUR_2026_LAUNCH_TRIGGER_ID,
  buildSummerTour2026LaunchEmailProps,
  greetingNameFromHandle,
} from './summerTour2026Launch.js';

describe('summerTour2026Launch', () => {
  it('exports stable ids', () => {
    expect(SUMMER_TOUR_2026_LAUNCH_TEMPLATE_ID).toBe('summer-tour-2026-launch');
    expect(SUMMER_TOUR_2026_LAUNCH_TRIGGER_ID).toBe('marketing_summer_tour_2026_launch');
    expect(SUMMER_TOUR_2026_LAUNCH_CAMPAIGN_ID).toBe('summer_tour_2026');
  });

  it('greetingNameFromHandle falls back to friend', () => {
    expect(greetingNameFromHandle('')).toBe('friend');
    expect(greetingNameFromHandle('  HotDog Billy  ')).toBe('HotDog Billy');
  });

  it('buildSummerTour2026LaunchEmailProps includes invite share URL', () => {
    const props = buildSummerTour2026LaunchEmailProps({
      handle: 'Picker1',
      audienceSegment: 'sphere_alum',
      inviteCode: 'abc12',
    });
    expect(props.greetingName).toBe('Picker1');
    expect(props.shareUrl).toContain('/join/ABC12');
    expect(props.shareUrl).toContain('utm_content=share_friends');
    expect(props.settingsUrl).toContain('/dashboard/profile/notifications');
  });
});
