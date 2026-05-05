import { describe, expect, it } from 'vitest';

import {
  buildSphere2026EmailAbbreviatedPlainText,
  buildSphere2026EmailPlainText,
  buildSphere2026PushPayload,
  getSphere2026EmailTeaserResultLine,
  getSphere2026PersonalParagraph,
} from './sphere2026Recap.js';

describe('getSphere2026PersonalParagraph', () => {
  it('returns champion copy for rank 1', () => {
    const t = getSphere2026PersonalParagraph({
      rank: 1,
      points: 160,
      wins: 4,
      showsPlayed: 9,
    });
    expect(t).toContain('Champion');
    expect(t).toContain('160');
    expect(t).toContain('4');
  });

  it('returns top 5 copy for rank 3', () => {
    const t = getSphere2026PersonalParagraph({
      rank: 3,
      points: 145,
      wins: 1,
      showsPlayed: 9,
    });
    expect(t).toContain('Top 5');
    expect(t).toContain('#3');
  });

  it('returns top 10 copy for rank 7', () => {
    const t = getSphere2026PersonalParagraph({
      rank: 7,
      points: 100,
      wins: 0,
      showsPlayed: 9,
    });
    expect(t).toContain('Top 10');
    expect(t).toContain('#7');
  });

  it('rank 11 all shows uses full-tour outside-top-10 copy', () => {
    const t = getSphere2026PersonalParagraph({
      rank: 11,
      points: 80,
      wins: 0,
      showsPlayed: 9,
    });
    expect(t).toContain('#11');
    expect(t).toContain('all 9 shows');
  });

  it('rank 11 partial tour uses attendance copy', () => {
    const t = getSphere2026PersonalParagraph({
      rank: 11,
      points: 80,
      wins: 0,
      showsPlayed: 4,
    });
    expect(t).toContain('4 shows');
  });
});

describe('buildSphere2026PushPayload', () => {
  it('uses champion body for rank 1', () => {
    const p = buildSphere2026PushPayload({ rank: 1, points: 160, wins: 4 });
    expect(p.title).toBeTruthy();
    expect(p.body).toContain('#1');
  });

  it('uses generic rank body otherwise', () => {
    const p = buildSphere2026PushPayload({ rank: 5, points: 120, wins: 2 });
    expect(p.body).toContain('#5');
  });
});

describe('buildSphere2026EmailPlainText', () => {
  it('includes podium and personalized section', () => {
    const body = buildSphere2026EmailPlainText({
      rank: 2,
      points: 150,
      wins: 3,
      showsPlayed: 9,
    });
    expect(body).toContain('THE PODIUM');
    expect(body).toContain('Rivertranced');
    expect(body).toContain('YOUR FINAL SPHERE 26 RESULT');
    expect(body).toContain('Top 5');
  });
});

describe('getSphere2026EmailTeaserResultLine', () => {
  it('calls out champion for rank 1', () => {
    const t = getSphere2026EmailTeaserResultLine({ rank: 1, points: 160, wins: 4 });
    expect(t).toContain('#1');
    expect(t).toContain('160');
  });

  it('uses generic finish line otherwise', () => {
    const t = getSphere2026EmailTeaserResultLine({ rank: 8, points: 90, wins: 1 });
    expect(t).toContain('#8');
    expect(t).toContain('90');
  });
});

describe('buildSphere2026EmailAbbreviatedPlainText', () => {
  it('includes dashboard CTA and site URL', () => {
    const body = buildSphere2026EmailAbbreviatedPlainText(
      { rank: 3, points: 120, wins: 1, showsPlayed: 9 },
      { siteUrl: 'https://example.test', recapPath: '/dashboard' },
    );
    expect(body).toContain('https://example.test/dashboard');
    expect(body).toContain('https://example.test');
    expect(body).toMatch(/log in/i);
    expect(body).toContain('Rivertranced');
  });
});
