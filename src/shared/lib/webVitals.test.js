import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ga4', () => ({
  ga4Event: vi.fn(),
  ga4IsReady: vi.fn(() => true),
}));

import { ga4Event, ga4IsReady } from './ga4';
import {
  buildWebVitalEventParams,
  reportWebVital,
} from './webVitals.js';

describe('buildWebVitalEventParams', () => {
  it('rounds LCP and includes route_group + metric_id', () => {
    expect(
      buildWebVitalEventParams(
        {
          name: 'LCP',
          value: 4210.4,
          id: 'v4-lcp-1',
          rating: 'needs-improvement',
        },
        { pathname: '/join/ABC', navigationType: 'navigate' },
      ),
    ).toEqual({
      metric_name: 'LCP',
      value: 4210,
      metric_id: 'v4-lcp-1',
      metric_rating: 'needs-improvement',
      route_group: 'invite_join',
      navigation_type: 'navigate',
    });
  });

  it('keeps CLS to three decimals', () => {
    expect(
      buildWebVitalEventParams(
        {
          name: 'CLS',
          value: 0.1234,
          id: 'v4-cls-1',
          rating: 'good',
        },
        { pathname: '/', navigationType: 'reload' },
      ).value,
    ).toBe(0.123);
  });
});

describe('reportWebVital', () => {
  beforeEach(() => {
    ga4Event.mockClear();
    ga4IsReady.mockReturnValue(true);
  });

  it('emits web_vital when GA is ready', () => {
    reportWebVital({
      name: 'INP',
      value: 88,
      id: 'v4-inp-1',
      rating: 'good',
    });
    expect(ga4Event).toHaveBeenCalledWith(
      'web_vital',
      expect.objectContaining({
        metric_name: 'INP',
        value: 88,
        metric_id: 'v4-inp-1',
      }),
    );
  });

  it('no-ops when GA is silent', () => {
    ga4IsReady.mockReturnValue(false);
    reportWebVital({
      name: 'LCP',
      value: 1000,
      id: 'v4-lcp-2',
      rating: 'good',
    });
    expect(ga4Event).not.toHaveBeenCalled();
  });
});
