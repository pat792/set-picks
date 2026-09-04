import { getSlotScoreBreakdown } from '../../../shared/utils/scoring';

const PRIMARY_HIT_KINDS = new Set(['exact_slot', 'encore_exact', 'wildcard_hit']);

/**
 * Graded Scorecard slot (#1013 Workstream A). Hit = any points > 0 from
 * {@link getSlotScoreBreakdown} only. Pre-grade callers should not invoke this.
 *
 * @param {string} fieldId
 * @param {string} song
 * @param {object | null | undefined} actualSetlist
 * @returns {{
 *   kind: import('../../../shared/utils/scoring').ScoreBreakdownKind | string,
 *   points: number,
 *   bustoutBoost: boolean,
 *   hit: boolean,
 * }}
 */
export function mapScorecardSlotGrade(fieldId, song, actualSetlist) {
  const { kind, points, bustoutBoost } = getSlotScoreBreakdown(
    fieldId,
    song,
    actualSetlist,
  );
  return {
    kind,
    points,
    bustoutBoost: Boolean(bustoutBoost),
    hit: points > 0,
  };
}

/**
 * Presentation spec for A5 chrome (ring + check). Lighter than Standings
 * `ScoreBreakdownGrid` fills. Bustout amber overlays the check/ring; kind
 * still drives title tone (`exact_slot` / `encore_exact` / `wildcard_hit` →
 * brand-primary, `in_setlist` → accent-blue).
 *
 * @param {{ kind?: string, points?: number, bustoutBoost?: boolean, hit?: boolean } | null | undefined} grade
 * @returns {{
 *   showCheck: boolean,
 *   titleTone: 'primary' | 'in_setlist' | 'miss' | 'default',
 *   ringTone: 'primary' | 'in_setlist' | 'amber' | null,
 *   checkTone: 'primary' | 'in_setlist' | 'amber' | null,
 *   titleMute: boolean,
 *   bustoutAccent: boolean,
 * }}
 */
export function scorecardHitChromeSpec(grade) {
  if (!grade) {
    return {
      showCheck: false,
      titleTone: 'default',
      ringTone: null,
      checkTone: null,
      titleMute: false,
      bustoutAccent: false,
    };
  }

  if (!grade.hit) {
    return {
      showCheck: false,
      titleTone: 'miss',
      ringTone: null,
      checkTone: null,
      titleMute: true,
      bustoutAccent: false,
    };
  }

  const titleTone = PRIMARY_HIT_KINDS.has(grade.kind)
    ? 'primary'
    : grade.kind === 'in_setlist'
      ? 'in_setlist'
      : 'primary';
  const bustoutAccent = Boolean(grade.bustoutBoost);

  return {
    showCheck: true,
    titleTone,
    ringTone: bustoutAccent ? 'amber' : titleTone,
    checkTone: bustoutAccent ? 'amber' : titleTone,
    titleMute: false,
    bustoutAccent,
  };
}
