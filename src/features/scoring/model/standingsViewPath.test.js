import { describe, expect, it } from 'vitest';

import { buildStandingsViewPath } from './standingsViewPath';

describe('buildStandingsViewPath', () => {
  it('builds the canonical Show path with no query', () => {
    expect(buildStandingsViewPath('show')).toBe('/dashboard/standings');
  });

  it('builds Tour with optional tour key', () => {
    expect(buildStandingsViewPath('tour')).toBe('/dashboard/standings?view=tour');
    expect(buildStandingsViewPath('tour', { tourKey: 'Summer 2026' })).toBe(
      '/dashboard/standings?view=tour&tour=Summer+2026',
    );
  });

  it('builds Pools with optional pool id', () => {
    expect(buildStandingsViewPath('pools')).toBe('/dashboard/standings?view=pools');
    expect(buildStandingsViewPath('pools', { poolId: 'abc' })).toBe(
      '/dashboard/standings?view=pools&pool=abc',
    );
  });

  it('builds Stats on the dedicated tour-stats route', () => {
    expect(buildStandingsViewPath('stats')).toBe('/dashboard/tour-stats');
    expect(buildStandingsViewPath('stats', { tourKey: 'Spring 2026' })).toBe(
      '/dashboard/tour-stats?tour=Spring+2026',
    );
  });

  it('ignores blank tour / pool keys', () => {
    expect(buildStandingsViewPath('stats', { tourKey: '  ' })).toBe(
      '/dashboard/tour-stats',
    );
    expect(buildStandingsViewPath('pools', { poolId: '' })).toBe(
      '/dashboard/standings?view=pools',
    );
  });
});
