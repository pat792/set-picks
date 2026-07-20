/**
 * Milestone badge catalog (#568) — v1 Participation + win_1.
 * Assets under `/badges/{id}.svg`.
 */

/** @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   tier: 'common' | 'uncommon' | 'rare' | 'legendary',
 *   src: string,
 * }} BadgeDefinition */

/** @type {readonly BadgeDefinition[]} */
export const PROFILE_BADGES = Object.freeze([
  {
    id: 'shows_played_1',
    name: 'First Show Scored',
    blurb: "Scored your first Setlist Pick 'Em show.",
    tier: 'common',
    src: '/badges/shows_played_1.svg',
  },
  {
    id: 'shows_played_5',
    name: 'Five on the Board',
    blurb: 'Played five scored shows.',
    tier: 'common',
    src: '/badges/shows_played_5.svg',
  },
  {
    id: 'shows_played_10',
    name: 'Ten-Show Run',
    blurb: 'Played ten scored shows.',
    tier: 'uncommon',
    src: '/badges/shows_played_10.svg',
  },
  {
    id: 'win_1',
    name: 'First Night Win',
    blurb: 'Topped a scored show.',
    tier: 'uncommon',
    src: '/badges/win_1.svg',
  },
]);

const TIER_ORDER = Object.freeze({
  legendary: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
});

const BADGE_BY_ID = new Map(PROFILE_BADGES.map((b) => [b.id, b]));

/**
 * @param {unknown} badgesMap users/{uid}.badges
 * @returns {Array<BadgeDefinition & { awardedAt: unknown, scope?: string }>}
 */
export function resolveEarnedBadges(badgesMap) {
  if (!badgesMap || typeof badgesMap !== 'object' || Array.isArray(badgesMap)) {
    return [];
  }

  /** @type {Array<BadgeDefinition & { awardedAt: unknown, scope?: string }>} */
  const earned = [];
  for (const [id, entry] of Object.entries(badgesMap)) {
    if (!entry || typeof entry !== 'object') continue;
    const def = BADGE_BY_ID.get(id);
    if (!def) continue;
    earned.push({
      ...def,
      awardedAt: /** @type {Record<string, unknown>} */ (entry).awardedAt,
      scope:
        typeof /** @type {Record<string, unknown>} */ (entry).scope === 'string'
          ? /** @type {string} */ (
              /** @type {Record<string, unknown>} */ (entry).scope
            )
          : undefined,
    });
  }

  earned.sort((a, b) => {
    const ta = TIER_ORDER[a.tier] ?? 99;
    const tb = TIER_ORDER[b.tier] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });
  return earned;
}
