/**
 * Consistent user-facing terms for dashboard / game surfaces:
 *
 * - **Standings** — Short nav label (`/dashboard/standings`). Same screen as “show standings”
 *   for the date selected in the header.
 * - **Show standings** — Ordered points for one show date only (everyone or one pool).
 * - **Season totals** — Running points, wins, and shows played in a pool across all graded nights
 *   (Pool Hub list — not the same as a single night’s show standings).
 */

/** Short tab / mobile context label */
export const NAV_LABEL_STANDINGS = 'Standings';

/** One-night ordered results (main list on Standings route + desktop H1). */
export const SHOW_STANDINGS_PHRASE = 'Show standings';

export const SHOW_STANDINGS_PAGE_HEADING = SHOW_STANDINGS_PHRASE;
export const SHOW_STANDINGS_EYEBROW = SHOW_STANDINGS_PHRASE;

export const SEASON_TOTALS_HEADING = 'Season totals';
export const SEASON_TOTALS_DESCRIPTION =
  'Running totals in this pool — points, wins, and shows played across every graded night (not just tonight).';

export const LEADING_THIS_SHOW = 'Leading this show';
