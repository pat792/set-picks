import { describe, expect, it } from 'vitest';

import {
  formatOddsPercent,
  SCORECARD_ODDS_UNKNOWN_LABEL,
  selectScorecardOdds,
} from './selectScorecardOdds';

const legacyArtifact = {
  modelVersion: 'v0.1.1-explainable',
  targetShow: { date: '2026-07-19' },
  slots: {
    s1o: [
      { name: 'Tweezer', normalizedName: 'tweezer', playProb: 0.184 },
      { name: "Wolfman's Brother", playProb: 0.09 },
    ],
    wild: [{ name: '46 Days', normalizedName: '46 days', playProb: 0.42 }],
  },
};

const mappedArtifact = {
  ...legacyArtifact,
  playProbBySong: {
    tweezer: 0.184,
    '46 days': 0.42,
  },
};

describe('selectScorecardOdds', () => {
  it('returns null when the artifact is missing or for another night', () => {
    expect(selectScorecardOdds(null, '2026-07-19', { s1o: 'Tweezer' })).toBeNull();
    expect(
      selectScorecardOdds(legacyArtifact, '2026-07-20', { s1o: 'Tweezer' }),
    ).toBeNull();
  });

  it('matches the player song to slot playProb and omits unmatched rows (legacy top-K)', () => {
    const rows = selectScorecardOdds(legacyArtifact, '2026-07-19', {
      s1o: 'Tweezer',
      wild: '46 Days',
      s1c: 'You Enjoy Myself',
    });
    expect(rows).toEqual([
      {
        fieldId: 's1o',
        label: 'Set 1 Opener',
        song: 'Tweezer',
        playProb: 0.184,
        unknown: false,
      },
      {
        fieldId: 'wild',
        label: 'Wildcard',
        song: '46 Days',
        playProb: 0.42,
        unknown: false,
      },
    ]);
  });

  it('returns null when no slot has a matching playProb (legacy top-K)', () => {
    expect(
      selectScorecardOdds(legacyArtifact, '2026-07-19', { s1o: 'First Tube' }),
    ).toBeNull();
  });

  it('looks up every pick on playProbBySong and floors unknown titles', () => {
    const rows = selectScorecardOdds(mappedArtifact, '2026-07-19', {
      s1o: 'Tweezer',
      wild: '46 Days',
      s1c: 'You Enjoy Myself',
    });
    expect(rows).toEqual([
      {
        fieldId: 's1o',
        label: 'Set 1 Opener',
        song: 'Tweezer',
        playProb: 0.184,
        unknown: false,
      },
      {
        fieldId: 's1c',
        label: 'Set 1 Closer',
        song: 'You Enjoy Myself',
        playProb: null,
        unknown: true,
      },
      {
        fieldId: 'wild',
        label: 'Wildcard',
        song: '46 Days',
        playProb: 0.42,
        unknown: false,
      },
    ]);
  });
});

describe('formatOddsPercent', () => {
  it('rounds playProb to a clamped percent', () => {
    expect(formatOddsPercent(0.184)).toBe('18%');
    expect(formatOddsPercent(0.42)).toBe('42%');
    expect(formatOddsPercent(1.4)).toBe('100%');
    expect(formatOddsPercent(-0.1)).toBe('0%');
    expect(formatOddsPercent(Number.NaN)).toBeNull();
  });

  it('labels unknown map misses as <1%', () => {
    expect(formatOddsPercent(null, { unknown: true })).toBe(SCORECARD_ODDS_UNKNOWN_LABEL);
  });
});
