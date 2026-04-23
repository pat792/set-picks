import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
  ga4IsReady: vi.fn(() => true),
}));

import { ga4Event, ga4IsReady } from '../../../shared/lib/ga4';
import { emitProfileSeasonStatsTelemetry } from './profileStatsTelemetry';

describe('emitProfileSeasonStatsTelemetry', () => {
  beforeEach(() => {
    ga4Event.mockClear();
    ga4IsReady.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits `profile_season_stats_computed` with normalized params', () => {
    emitProfileSeasonStatsTelemetry({
      shows_checked: 30,
      shows_played: 4,
      collection_queries: 4,
      elapsed_ms: 812.4,
      self_view: true,
      cache_hit: false,
      source: 'live',
    });
    expect(ga4Event).toHaveBeenCalledTimes(1);
    expect(ga4Event).toHaveBeenCalledWith('profile_season_stats_computed', {
      shows_checked: 30,
      shows_played: 4,
      collection_queries: 4,
      elapsed_ms: 812,
      self_view: true,
      cache_hit: false,
      source: 'live',
    });
  });

  it('coerces non-numeric values to 0 and rounds elapsed_ms', () => {
    emitProfileSeasonStatsTelemetry({
      shows_checked: '12',
      shows_played: null,
      collection_queries: undefined,
      elapsed_ms: 'x',
      self_view: false,
    });
    expect(ga4Event).toHaveBeenCalledWith('profile_season_stats_computed', {
      shows_checked: 12,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 0,
      self_view: false,
      cache_hit: false,
      source: 'materialized',
    });
  });

  it('passes through `cache_hit: true` for React Query cache-served views', () => {
    emitProfileSeasonStatsTelemetry({
      shows_checked: 0,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 0,
      self_view: false,
      cache_hit: true,
      source: 'materialized',
    });
    expect(ga4Event).toHaveBeenCalledWith('profile_season_stats_computed', {
      shows_checked: 0,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 0,
      self_view: false,
      cache_hit: true,
      source: 'materialized',
    });
  });

  it('marks a materialized short-circuit with source="materialized" and 1 show read', () => {
    emitProfileSeasonStatsTelemetry({
      shows_checked: 1,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 34,
      self_view: false,
      cache_hit: false,
      source: 'materialized',
    });
    expect(ga4Event).toHaveBeenCalledWith('profile_season_stats_computed', {
      shows_checked: 1,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 34,
      self_view: false,
      cache_hit: false,
      source: 'materialized',
    });
  });

  it('defaults to source="materialized" when source is omitted or invalid', () => {
    emitProfileSeasonStatsTelemetry({
      shows_checked: 1,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 10,
      self_view: false,
      source: 'bogus',
    });
    expect(ga4Event).toHaveBeenCalledWith('profile_season_stats_computed', {
      shows_checked: 1,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 10,
      self_view: false,
      cache_hit: false,
      source: 'materialized',
    });
  });

  it('skips GA when GA is not initialized', () => {
    ga4IsReady.mockReturnValue(false);
    emitProfileSeasonStatsTelemetry({
      shows_checked: 1,
      shows_played: 0,
      collection_queries: 0,
      elapsed_ms: 100,
      self_view: false,
    });
    expect(ga4Event).not.toHaveBeenCalled();
  });

  it('survives GA emit failures without throwing', () => {
    ga4Event.mockImplementation(() => {
      throw new Error('boom');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      emitProfileSeasonStatsTelemetry({
        shows_checked: 1,
        shows_played: 0,
        collection_queries: 0,
        elapsed_ms: 100,
        self_view: false,
      })
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
