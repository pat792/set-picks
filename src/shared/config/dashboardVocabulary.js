/**
 * Consistent user-facing terms for dashboard / game surfaces:
 *
 * - **Standings** — Short nav label (`/dashboard/standings`). Same screen as “show standings”
 *   for the date selected in the header.
 * - **Show standings** — Ordered points for one show date only (everyone or one pool).
 * - **Season totals** — Running points, wins, and shows played in a pool across all graded nights
 *   (on pool details — not the same as a single night’s show standings).
 *
 * - **Pool details** — Player-facing name for `/dashboard/pool/:id` (roster, invites, season totals).
 *   Internal code may still use “Pool Hub”; user-facing strings should say Pool details.
 */

/** Primary tab for locking picks (`/dashboard`) — same label in context bar + desktop H1 */
export const NAV_LABEL_PICKS = 'Picks';

/** Short tab / mobile context label */
export const NAV_LABEL_STANDINGS = 'Standings';

/** Mobile context bar label for a specific pool’s detail route */
export const NAV_LABEL_POOL_DETAILS = 'Pool Details';

/**
 * Desktop layout eyebrow for pool detail (matches in-page section label styling, e.g. Game Status).
 */
export const POOL_DETAILS_LAYOUT_EYEBROW = 'Pool details';

/** One-night ordered results (main list on Standings route + desktop H1). */
export const SHOW_STANDINGS_PHRASE = 'Show standings';

export const SHOW_STANDINGS_PAGE_HEADING = SHOW_STANDINGS_PHRASE;
export const SHOW_STANDINGS_EYEBROW = SHOW_STANDINGS_PHRASE;

export const SEASON_TOTALS_HEADING = 'Season totals';
export const SEASON_TOTALS_DESCRIPTION =
  'Running totals in this pool — points, wins, and shows played across every graded night (not just tonight).';

export const LEADING_THIS_SHOW = 'Leading this show';
