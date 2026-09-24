import { describe, expect, it } from 'vitest';

import {
  PREVIEW_TOUR_EDITION,
  TOUR_RECAP_TEMPLATE_ID,
  buildTourRecapEmailAbbreviatedPlainText,
  buildTourRecapEmailPlainText,
  buildTourRecapPushPayload,
  getTourRecapEmailTeaserResultLine,
  getTourRecapPersonalParagraph,
  resolveTourRecapRankBranch,
} from './tourRecap.js';

const previewCtx = {
  edition: PREVIEW_TOUR_EDITION,
  showCount: PREVIEW_TOUR_EDITION.showCount,
  participantCount: PREVIEW_TOUR_EDITION.participantCount,
  tourName: PREVIEW_TOUR_EDITION.tourName,
};

describe('resolveTourRecapRankBranch', () => {
  it('maps champion / top 5 / top 10 / full-run / partial / fallback', () => {
    expect(resolveTourRecapRankBranch({ rank: 1, showsPlayed: 8, showCount: 8 })).toBe('champion');
    expect(resolveTourRecapRankBranch({ rank: 5, showsPlayed: 8, showCount: 8 })).toBe('top5');
    expect(resolveTourRecapRankBranch({ rank: 8, showsPlayed: 8, showCount: 8 })).toBe('top10');
    expect(resolveTourRecapRankBranch({ rank: 12, showsPlayed: 8, showCount: 8 })).toBe('full_run');
    expect(resolveTourRecapRankBranch({ rank: 12, showsPlayed: 3, showCount: 8 })).toBe('partial');
    expect(resolveTourRecapRankBranch({ rank: 0, showsPlayed: 1, showCount: 8 })).toBe('fallback');
  });
});

describe('getTourRecapPersonalParagraph', () => {
  it('returns champion copy for rank 1', () => {
    const t = getTourRecapPersonalParagraph({
      ...previewCtx,
      rank: 1,
      points: 180,
      wins: 3,
      showsPlayed: 8,
    });
    expect(t).toContain('Champion');
    expect(t).toContain('180');
    expect(t).toContain('3');
    expect(t).toContain('Sample Tour');
    expect(t).not.toMatch(/Sphere/i);
  });

  it('returns top 5 copy for rank 3', () => {
    const t = getTourRecapPersonalParagraph({
      ...previewCtx,
      rank: 3,
      points: 150,
      wins: 1,
      showsPlayed: 8,
    });
    expect(t).toContain('Top 5');
    expect(t).toContain('#3');
  });

  it('returns top 10 copy for rank 7', () => {
    const t = getTourRecapPersonalParagraph({
      ...previewCtx,
      rank: 7,
      points: 100,
      wins: 0,
      showsPlayed: 8,
    });
    expect(t).toContain('Top 10');
    expect(t).toContain('#7');
  });

  it('rank 11 all shows uses full-tour outside-top-10 copy', () => {
    const t = getTourRecapPersonalParagraph({
      ...previewCtx,
      rank: 11,
      points: 80,
      wins: 0,
      showsPlayed: 8,
    });
    expect(t).toContain('#11');
    expect(t).toContain('all 8 shows');
  });

  it('rank 11 partial tour uses attendance copy', () => {
    const t = getTourRecapPersonalParagraph({
      ...previewCtx,
      rank: 11,
      points: 80,
      wins: 0,
      showsPlayed: 4,
    });
    expect(t).toContain('4 shows');
  });
});

describe('buildTourRecapPushPayload', () => {
  it('uses champion body for rank 1', () => {
    const p = buildTourRecapPushPayload({
      rank: 1,
      points: 180,
      wins: 3,
      edition: PREVIEW_TOUR_EDITION,
    });
    expect(p.title).toBe('Tour recap is in');
    expect(p.body).toContain('#1');
    expect(p.title).not.toMatch(/Sphere/i);
  });

  it('uses generic rank body otherwise', () => {
    const p = buildTourRecapPushPayload({
      rank: 5,
      points: 120,
      wins: 2,
      edition: PREVIEW_TOUR_EDITION,
    });
    expect(p.body).toContain('#5');
  });
});

describe('buildTourRecapEmailPlainText', () => {
  it('includes podium and personalized section without Sphere live IDs', () => {
    const body = buildTourRecapEmailPlainText({
      ...previewCtx,
      rank: 2,
      points: 165,
      wins: 2,
      showsPlayed: 8,
    });
    expect(body).toContain('THE PODIUM');
    expect(body).toContain('ChampionPat');
    expect(body).toContain('YOUR FINAL RESULT');
    expect(body).toContain('Top 5');
    expect(body).not.toMatch(/sphere-2026-inaugural/i);
    expect(body).not.toMatch(/Rivertranced/);
  });
});

describe('getTourRecapEmailTeaserResultLine', () => {
  it('calls out champion for rank 1', () => {
    const t = getTourRecapEmailTeaserResultLine({
      rank: 1,
      points: 180,
      wins: 3,
      edition: PREVIEW_TOUR_EDITION,
    });
    expect(t).toContain('#1');
    expect(t).toContain('180');
    expect(t).toContain('Sample Tour');
  });

  it('uses generic finish line otherwise', () => {
    const t = getTourRecapEmailTeaserResultLine({
      rank: 8,
      points: 90,
      wins: 1,
      edition: PREVIEW_TOUR_EDITION,
    });
    expect(t).toContain('#8');
    expect(t).toContain('90');
  });
});

describe('buildTourRecapEmailAbbreviatedPlainText', () => {
  it('includes dashboard CTA and site URL', () => {
    const body = buildTourRecapEmailAbbreviatedPlainText(
      {
        ...previewCtx,
        rank: 3,
        points: 120,
        wins: 1,
        showsPlayed: 8,
      },
      { siteUrl: 'https://example.test', recapPath: '/dashboard' },
    );
    expect(body).toContain('https://example.test/dashboard');
    expect(body).toContain('https://example.test');
    expect(body).toMatch(/log in/i);
    expect(body).toContain('ChampionPat');
    expect(TOUR_RECAP_TEMPLATE_ID).toBe('tour-recap');
  });
});
