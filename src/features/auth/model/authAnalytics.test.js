import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
}));

import { ga4Event } from '../../../shared/lib/ga4';
import {
  AUTH_TIMING_MAX_MS,
  buildAuthGoogleTimingParams,
  buildAuthSurfaceTimingParams,
  clampAuthTimingMs,
  trackAuthGoogleTiming,
  trackAuthSurfaceTiming,
} from './authAnalytics.js';

describe('clampAuthTimingMs', () => {
  it('rounds and rejects outliers', () => {
    expect(clampAuthTimingMs(12.6)).toBe(13);
    expect(clampAuthTimingMs(-1)).toBeNull();
    expect(clampAuthTimingMs(AUTH_TIMING_MAX_MS + 1)).toBeNull();
    expect(clampAuthTimingMs(Number.NaN)).toBeNull();
  });
});

describe('buildAuthSurfaceTimingParams', () => {
  it('builds paint_to_ready params', () => {
    expect(
      buildAuthSurfaceTimingParams({
        valueMs: 420.4,
        warmPath: 'idle',
        navigationType: 'navigate',
      }),
    ).toEqual({
      phase: 'paint_to_ready',
      value: 420,
      route_group: 'login',
      warm_path: 'idle',
      navigation_type: 'navigate',
    });
  });

  it('omits absurd values', () => {
    expect(
      buildAuthSurfaceTimingParams({ valueMs: AUTH_TIMING_MAX_MS + 50 }),
    ).toBeNull();
  });
});

describe('buildAuthGoogleTimingParams', () => {
  it('builds click_to_popup params', () => {
    expect(
      buildAuthGoogleTimingParams({
        phase: 'click_to_popup',
        valueMs: 8.2,
        authFlow: 'popup',
        outcome: 'success',
      }),
    ).toEqual({
      phase: 'click_to_popup',
      value: 8,
      method: 'google',
      auth_flow: 'popup',
      outcome: 'success',
    });
  });

  it('includes error_code on failures', () => {
    expect(
      buildAuthGoogleTimingParams({
        phase: 'click_to_popup',
        valueMs: 120,
        authFlow: 'redirect',
        outcome: 'error',
        errorCode: 'auth/popup-blocked',
      }),
    ).toEqual({
      phase: 'click_to_popup',
      value: 120,
      method: 'google',
      auth_flow: 'redirect',
      outcome: 'error',
      error_code: 'auth/popup-blocked',
    });
  });
});

describe('trackAuth*Timing', () => {
  beforeEach(() => {
    ga4Event.mockClear();
  });

  it('emits surface + google timing via ga4Event', () => {
    trackAuthSurfaceTiming({
      valueMs: 100,
      warmPath: 'intent',
      navigationType: 'reload',
    });
    trackAuthGoogleTiming({
      phase: 'credential_to_nav',
      valueMs: 50,
      authFlow: 'popup',
      outcome: 'success',
    });

    expect(ga4Event).toHaveBeenNthCalledWith(1, 'auth_surface_timing', {
      phase: 'paint_to_ready',
      value: 100,
      route_group: 'login',
      warm_path: 'intent',
      navigation_type: 'reload',
    });
    expect(ga4Event).toHaveBeenNthCalledWith(2, 'auth_google_timing', {
      phase: 'credential_to_nav',
      value: 50,
      method: 'google',
      auth_flow: 'popup',
      outcome: 'success',
    });
  });

  it('skips emit when value is capped out', () => {
    trackAuthSurfaceTiming({ valueMs: AUTH_TIMING_MAX_MS + 1 });
    expect(ga4Event).not.toHaveBeenCalled();
  });
});
