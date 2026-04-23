/**
 * Consistent user-facing terms for dashboard / game surfaces:
 *
 * - **Standings** — Short nav label (`/dashboard/standings`). Same screen as “show standings”
 *   for the date selected in the header.
 * - **Show standings** — Ordered points for one show date only (everyone or one pool).
 * - **All-time standings** — Cumulative leaderboard across every finalized show (all tours).
 *   Canonical name replacing legacy “Season totals” on pool details and optional global
 *   companion on Standings. See #148.
 * - **Tour standings** — Cumulative leaderboard scoped to the current tour via
 *   `show_calendar.showDatesByTour` (global surface on Standings; pool-scoped on pool details).
 *   See #148 / #219.
 * - **Season totals** — Legacy alias for All-time standings on pool details; kept during the
 *   transition and re-exported through {@link POOL_ALL_TIME_STANDINGS_HEADING}.
 *
 * - **Pool details** — Player-facing name for `/dashboard/pool/:id` (roster, invites, season totals).
 *   Internal code may still use “Pool Hub”; user-facing strings should say Pool details.
 */

/** Primary tab for locking picks (`/dashboard`) — same label in context bar + desktop H1 */
export const NAV_LABEL_PICKS = 'Picks';

/** Pools list tab + context + desktop H1 (`/dashboard/pools`) */
export const NAV_LABEL_POOLS = 'Pools';

/** Profile tab + context (`/dashboard/profile`); in-page desktop subheading matches */
export const NAV_LABEL_PROFILE = 'Profile';

/** Admin tab label (`/dashboard/admin`); context/desktop title stays War Room */
export const NAV_LABEL_ADMIN = 'Admin';

/** Account security route — context bar (matches Profile card + form destination copy) */
export const NAV_LABEL_ACCOUNT_SECURITY = 'Sign-in & password';

/** Short tab / mobile context label */
export const NAV_LABEL_STANDINGS = 'Standings';

/** Mobile context bar label for a specific pool’s detail route */
export const NAV_LABEL_POOL_DETAILS = 'Pool Details';

/**
 * Desktop layout eyebrow for pool detail (matches in-page section label styling, e.g. Game Status).
 */
export const POOL_DETAILS_LAYOUT_EYEBROW = 'Pool details';

/** One-night ordered results (main list on Standings route; glossary / in-page copy). */
export const SHOW_STANDINGS_PHRASE = 'Show standings';

/** Desktop H1 for `/dashboard/standings` matches {@link NAV_LABEL_STANDINGS} (nav + context bar). */
export const SHOW_STANDINGS_EYEBROW = SHOW_STANDINGS_PHRASE;

/**
 * Cumulative "across every finalized show" leaderboard heading. Canonical
 * name; retires **Season totals** in net-new copy. See #148.
 */
export const ALL_TIME_STANDINGS_HEADING = 'All-time standings';
export const ALL_TIME_STANDINGS_DESCRIPTION =
  'Running totals across every graded show — points, wins, and shows played (not just tonight).';

/** Pool-scoped alias of {@link ALL_TIME_STANDINGS_HEADING} for pool details. */
export const POOL_ALL_TIME_STANDINGS_HEADING = ALL_TIME_STANDINGS_HEADING;
export const POOL_ALL_TIME_STANDINGS_DESCRIPTION =
  'Running totals in this pool — points, wins, and shows played across every graded show.';

/**
 * Tour-scoped cumulative leaderboard heading. Scope comes from
 * `show_calendar.showDatesByTour` at runtime. See #148 / #219.
 */
export const TOUR_STANDINGS_HEADING = 'Tour standings';
export const TOUR_STANDINGS_DESCRIPTION =
  'Running totals for the current tour — points, wins, and shows played across every graded show in this tour.';

/** Pool-scoped alias of {@link TOUR_STANDINGS_HEADING} for pool details. */
export const POOL_TOUR_STANDINGS_HEADING = TOUR_STANDINGS_HEADING;
export const POOL_TOUR_STANDINGS_DESCRIPTION =
  'Running totals in this pool for the current tour — points, wins, and shows played across every graded show in this tour.';

/**
 * Legacy alias retained so existing call sites don't churn while we migrate
 * pool details to **All-time standings** (#148). New code should prefer the
 * `*_ALL_TIME_STANDINGS_*` names above.
 * @deprecated Use {@link POOL_ALL_TIME_STANDINGS_HEADING}.
 */
export const SEASON_TOTALS_HEADING = POOL_ALL_TIME_STANDINGS_HEADING;
/** @deprecated Use {@link POOL_ALL_TIME_STANDINGS_DESCRIPTION}. */
export const SEASON_TOTALS_DESCRIPTION = POOL_ALL_TIME_STANDINGS_DESCRIPTION;

export const LEADING_THIS_SHOW = 'Leading this show';

/**
 * Copy for the Standings "overall winner of the night" banner (#218). Ties
 * render the plural heading; winners are a comma-separated list.
 */
export const TONIGHTS_WINNER_SINGULAR = "Tonight's winner";
export const TONIGHTS_WINNERS_PLURAL = "Tonight's winners";

/**
 * Pick the correct singular/plural heading for the winner(s) of the night.
 *
 * @param {number} winnerCount
 * @returns {string}
 */
export function tonightsWinnerHeading(winnerCount) {
  return winnerCount > 1 ? TONIGHTS_WINNERS_PLURAL : TONIGHTS_WINNER_SINGULAR;
}
