import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
}));

import { ga4Event } from '../../../shared/lib/ga4';
import {
  resolveLiveSetlistStatus,
  trackLiveSetlistView,
} from './standingsAnalytics.js';

describe('resolveLiveSetlistStatus', () => {
  it('maps LIVE / PAST / other', () => {
    expect(resolveLiveSetlistStatus('LIVE')).toBe('live');
    expect(resolveLiveSetlistStatus('PAST')).toBe('final');
    expect(resolveLiveSetlistStatus('NEXT')).toBe('waiting');
    expect(resolveLiveSetlistStatus('')).toBe('waiting');
  });
});

describe('trackLiveSetlistView', () => {
  beforeEach(() => {
    ga4Event.mockClear();
  });

  it('emits live_setlist_view with show_date and setlist_status', () => {
    trackLiveSetlistView({
      show_date: '2026-07-15',
      setlist_status: 'live',
    });
    expect(ga4Event).toHaveBeenCalledWith('live_setlist_view', {
      show_date: '2026-07-15',
      setlist_status: 'live',
    });
  });

  it('defaults empty date and waiting status', () => {
    trackLiveSetlistView();
    expect(ga4Event).toHaveBeenCalledWith('live_setlist_view', {
      show_date: '',
      setlist_status: 'waiting',
    });
  });
});
