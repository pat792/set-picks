/**
 * In-app comms template registry — maps a `templateId` (from
 * `docs/comms-triggers/catalog.json`) to its in-app renderer.
 *
 * Two render shapes are supported:
 *  - `build(payload)` → a plain structure rendered by {@link CommsTemplateBody}
 *    (used by all v1 lifecycle / show / results templates).
 *  - `Component` → a bespoke React component (used by the rich Sphere recap).
 *
 * `samples` powers the dev-only Comms Template Preview screen and the unit tests,
 * so every template ships with realistic preview data.
 */

import React from 'react';
import {
  AlarmClock,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Crown,
  PartyPopper,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';

import { SPHERE_2026_RECAP_ID, Sphere2026TourRecapInApp } from '../../../tour-recap';
import { buildTourRankingsDailyParagraphs } from '../../model/tourRankingsDailyCopy';

const FALLBACK_HANDLE = 'Picker';

function handleOf(payload) {
  const h = payload?.handle;
  return typeof h === 'string' && h.trim() ? h.trim() : FALLBACK_HANDLE;
}

function ordinal(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? '');
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

function appendCityIfNeeded(venue, city) {
  if (!city) return venue || '';
  if (!venue) return city;
  if (venue.toLowerCase().includes(city.toLowerCase())) return venue;
  return `${venue}, ${city}`;
}

function venueLine(payload, { dateKey = 'show_date', venueKey = 'venue_name', cityKey = 'venue_city' } = {}) {
  const venue = typeof payload?.[venueKey] === 'string' ? payload[venueKey].trim() : '';
  const city =
    cityKey && cityKey !== '__none' && typeof payload?.[cityKey] === 'string'
      ? payload[cityKey].trim()
      : '';
  const place = appendCityIfNeeded(venue, city);
  const date = typeof payload?.[dateKey] === 'string' ? payload[dateKey].trim() : '';
  if (date && place) return `${date} — ${place}`;
  return place || date || '';
}

const PICKS_HREF = '/dashboard/picks';
/** Matches dashboard StandingsActiveShowCard / PoolHubActiveShow (#509). */
const VIEW_EDIT_PICKS_CTA = { label: 'View / Edit picks', href: PICKS_HREF };

/**
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function isPicksSecured(p) {
  return p?.picks_secured === true || p?.picks_secured === 'true';
}

/**
 * In-app CTA for tour countdown — varies by `days_remaining` (TRIGGER_CATALOG.md §2).
 * When `picks_secured`, T-5/T-3/T-1 switch to View / Edit picks (#509). T-10 stays exploratory.
 * Push/email may use "open the app" phrasing; in-app users are already in the app.
 * @param {Record<string, unknown>} p
 */
function tourCountdownInAppCta(p) {
  const days = Number(p.days_remaining);
  if (days === 10) {
    return { label: 'View upcoming shows', href: PICKS_HREF };
  }
  if (isPicksSecured(p)) {
    return { ...VIEW_EDIT_PICKS_CTA };
  }
  if (days === 5 || days === 3) {
    return { label: 'Make picks for show 1', href: PICKS_HREF };
  }
  if (days === 1) {
    return { label: 'Lock in your picks', href: PICKS_HREF };
  }
  return { label: 'Make your picks', href: PICKS_HREF };
}

/**
 * @typedef {object} CommsTemplateEntry
 * @property {string} triggerId
 * @property {string} displayName
 * @property {(payload: Record<string, unknown>) => object} [build]
 * @property {React.ComponentType<any>} [Component]
 * @property {(payload: Record<string, unknown>) => object} [toComponentProps]
 * @property {{ name: string, payload: Record<string, unknown> }[]} samples
 */

/** @type {Record<string, CommsTemplateEntry>} */
export const COMMS_TEMPLATE_REGISTRY = {
  'account-welcome': {
    triggerId: 'account_welcome',
    displayName: 'Welcome',
    build: (p) => ({
      icon: PartyPopper,
      accentClassName: 'text-teal-400',
      eyebrow: 'Welcome aboard',
      title: `Welcome to Setlist Pick'em, ${handleOf(p)}`,
      paragraphs: [
        "Joining the community means you get to track every show of every tour. Invite friends to play in a Private Pool, or just stick with competing against all who play a given night. We are so excited you're here, and hope you'll spread the word.",
        p.next_show_date
          ? `Your next chance to play: ${venueLine(p, { dateKey: 'next_show_date', venueKey: 'next_show_venue', cityKey: '__none' })}.`
          : 'Head to the dashboard, make your first set of picks, and you’re on the board.',
      ],
      cta: { label: 'Make your first picks', href: '/dashboard/picks' },
    }),
    samples: [
      {
        name: 'With next show',
        payload: {
          handle: 'RiverTranced',
          tour_name: 'Summer Tour 2026',
          next_show_date: 'Jul 18',
          next_show_venue: 'Madison Square Garden',
        },
      },
      { name: 'No next show / fallback handle', payload: {} },
    ],
  },

  'tour-countdown': {
    triggerId: 'tour_countdown',
    displayName: 'Tour countdown',
    build: (p) => {
      const days = Number(p.days_remaining);
      const dayLabel = Number.isFinite(days)
        ? days === 0
          ? 'today'
          : days === 1
            ? 'tomorrow'
            : `in ${days} days`
        : 'soon';
      return {
        icon: CalendarClock,
        accentClassName: 'text-amber-300',
        eyebrow: `Tour starts ${dayLabel}`,
        title: p.tour_name ? `${p.tour_name} is almost here` : 'The next tour is almost here',
        paragraphs: [
          `${handleOf(p)}, the run kicks off ${dayLabel}.`,
          venueLine(p, { dateKey: 'first_show_date', venueKey: 'first_show_venue', cityKey: 'first_show_city' })
            ? `First show: ${venueLine(p, { dateKey: 'first_show_date', venueKey: 'first_show_venue', cityKey: 'first_show_city' })}.`
            : 'The first show is coming up.',
          'Get your picks ready before the first downbeat.',
        ],
        cta: tourCountdownInAppCta(p),
      };
    },
    samples: [
      {
        name: 'T-10',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 10,
          first_show_date: 'Jul 18',
          first_show_venue: 'MSG',
          first_show_city: 'New York, NY',
          lock_time_local: '7:30 PM',
        },
      },
      {
        name: 'T-5',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 5,
          first_show_date: 'Jul 18',
          first_show_venue: 'MSG',
          first_show_city: 'New York, NY',
          lock_time_local: '7:30 PM',
        },
      },
      {
        name: 'T-3',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 3,
          first_show_date: 'Jul 7',
          first_show_venue: 'Kohl Center',
          first_show_city: 'Madison, WI',
          lock_time_local: '7:30 PM',
        },
      },
      {
        name: 'T-1',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 1,
          first_show_date: 'Jul 18',
          first_show_venue: 'MSG',
          first_show_city: 'New York, NY',
        },
      },
      {
        name: 'T-3 picks secured',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 3,
          first_show_date: 'Jul 7',
          first_show_venue: 'Kohl Center',
          first_show_city: 'Madison, WI',
          lock_time_local: '7:30 PM',
          picks_secured: true,
        },
      },
      {
        name: 'T-1 picks secured',
        payload: {
          handle: 'ArmenianMan',
          tour_name: 'Summer Tour 2026',
          days_remaining: 1,
          first_show_date: 'Jul 18',
          first_show_venue: 'MSG',
          first_show_city: 'New York, NY',
          picks_secured: true,
        },
      },
    ],
  },

  'picks-confirmed': {
    triggerId: 'picks_confirmed',
    displayName: 'Picks confirmed',
    build: (p) => {
      const picks = [
        ['Opener', p.opener_pick],
        ['Closer', p.closer_pick],
        ['Encore', p.encore_pick],
        ['Wildcard', p.wildcard_pick],
      ].filter(([, v]) => v);
      return {
        icon: CheckCircle2,
        accentClassName: 'text-emerald-300',
        eyebrow: 'Picks locked',
        title: "You're locked in",
        paragraphs: [
          `${handleOf(p)}, your picks for ${venueLine(p) || 'the show'} are confirmed.`,
          'Sit back — we’ll score them live as the setlist comes in.',
        ],
        stats: picks.map(([label, value]) => ({ label, value })),
        cta: { label: 'Review your picks', href: '/dashboard/picks' },
      };
    },
    samples: [
      {
        name: 'Full picks',
        payload: {
          handle: 'drgluhanick',
          show_date: 'Jul 18',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          opener_pick: 'Wilson',
          closer_pick: 'Slave to the Traffic Light',
          encore_pick: 'Loving Cup',
          wildcard_pick: 'Harpua',
        },
      },
    ],
  },

  'score-first-points': {
    triggerId: 'score_first_points',
    displayName: 'First points',
    build: (p) => ({
      icon: Zap,
      accentClassName: 'text-amber-300',
      eyebrow: 'On the board',
      title: 'You just scored!',
      paragraphs: [
        p.song_name
          ? `${handleOf(p)}, "${p.song_name}" hit${p.pick_type ? ` as your ${p.pick_type}` : ''} — you're on the board.`
          : `${handleOf(p)}, your first pick of the night just landed.`,
      ],
      stats: [
        p.points_earned != null ? { label: 'Points', value: `+${p.points_earned}` } : null,
        p.current_score != null ? { label: 'Score', value: p.current_score } : null,
        p.global_rank != null ? { label: 'Rank', value: `#${p.global_rank}` } : null,
      ].filter(Boolean),
      cta: { label: 'Watch it live', href: '/dashboard/standings' },
    }),
    samples: [
      {
        name: 'First points',
        payload: {
          handle: 'HotDogBilly',
          song_name: 'Tweezer',
          pick_type: 'wildcard',
          points_earned: 25,
          current_score: 25,
          global_rank: 12,
        },
      },
    ],
  },

  'score-leader': {
    triggerId: 'score_leader',
    displayName: 'Took the lead',
    build: (p) => ({
      icon: Crown,
      accentClassName: 'text-yellow-300',
      eyebrow: 'New leader',
      title: `You're #1 on ${p.leaderboard_name || 'the leaderboard'}`,
      paragraphs: [
        `${handleOf(p)}, you just took the top spot on ${p.leaderboard_name || 'the Global'} leaderboard.${
          p.lead_margin != null ? ` You're up by ${p.lead_margin}.` : ''
        }`,
        'Can you hold it through the encore?',
      ],
      stats: [
        p.current_score != null ? { label: 'Score', value: p.current_score } : null,
        p.lead_margin != null ? { label: 'Lead', value: `+${p.lead_margin}` } : null,
      ].filter(Boolean),
      cta: { label: 'Defend your lead', href: '/dashboard/standings' },
    }),
    samples: [
      {
        name: 'Global leader',
        payload: { handle: 'RiverTranced', leaderboard_name: 'Global', current_score: 95, lead_margin: 10 },
      },
    ],
  },

  'show-recap': {
    triggerId: 'show_recap',
    displayName: 'Show recap',
    build: (p) => {
      const narrative =
        (typeof p.narrative_line === 'string' && p.narrative_line.trim()) ||
        (typeof p.setlist_highlight === 'string' && p.setlist_highlight.trim()) ||
        '';
      return {
        icon: BarChart3,
        accentClassName: 'text-teal-400',
        eyebrow: 'Show recap',
        title: p.venue_name ? `Recap: ${p.venue_name}` : 'Your show recap',
        paragraphs: [
          `${handleOf(p)}, here's how your picks for ${venueLine(p) || 'the show'} graded out.`,
          narrative ||
            (p.correct_picks_count != null && p.total_picks_count != null
              ? `You nailed ${p.correct_picks_count} of ${p.total_picks_count} picks.`
              : 'Tap through for the full breakdown.'),
          p.bustout_bonus ? `Bustout bonus: +${p.bustout_bonus}.` : null,
        ].filter(Boolean),
        stats: [
          p.show_score != null ? { label: 'Show score', value: p.show_score } : null,
          p.global_rank != null
            ? {
                label: 'Global rank',
                value:
                  p.global_total_pickers != null
                    ? `#${p.global_rank}/${p.global_total_pickers}`
                    : `#${p.global_rank}`,
              }
            : null,
          p.pool_rank != null && p.pool_name
            ? { label: p.pool_name, value: `#${p.pool_rank}` }
            : null,
        ].filter(Boolean),
        // Inbox card is the tease; graded self-recap lives on Standings (#551).
        cta: { label: 'See standings', href: '/dashboard/standings#self-recap' },
      };
    },
    samples: [
      {
        name: 'Graded show + bustout highlight',
        payload: {
          handle: 'ArmenianMan',
          show_date: 'Jul 18',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          show_score: 70,
          global_rank: 4,
          global_total_pickers: 312,
          pool_name: 'Couch Tour',
          pool_rank: 1,
          correct_picks_count: 3,
          total_picks_count: 4,
          setlist_highlight: "Wolfman's Brother - an 87 show gap",
          narrative_line: "You caught a bustout — Wolfman's Brother - an 87 show gap.",
          narrative_branch: 'bustout_hero',
          bustout_bonus: 20,
          user_bustout_hits: [{ title: "Wolfman's Brother", gap: 87 }],
          correct_picks_count: 3,
          total_picks_count: 6,
          opener_title: 'YEM',
          encore_title: 'Slave to the Traffic Light',
        },
      },
    ],
  },

  'tour-rankings-daily': {
    triggerId: 'tour_rankings_daily',
    displayName: 'Tour rankings',
    build: (p) => {
      const paragraphs = buildTourRankingsDailyParagraphs(p);
      const tourRankLabel =
        p.tour_rank != null
          ? p.tour_rank_tied
            ? `tied #${p.tour_rank}${
                p.total_tour_pickers != null ? `/${p.total_tour_pickers}` : ''
              }`
            : p.total_tour_pickers != null
              ? `#${p.tour_rank}/${p.total_tour_pickers}`
              : `#${p.tour_rank}`
          : null;
      return {
        icon: TrendingUp,
        accentClassName: 'text-sky-300',
        eyebrow: 'Tour standings',
        title: 'Where you stand on tour',
        paragraphs,
        stats: [
          tourRankLabel != null ? { label: 'Tour rank', value: tourRankLabel } : null,
          p.tour_points != null ? { label: 'Tour points', value: p.tour_points } : null,
          p.shows_played != null ? { label: 'Shows', value: p.shows_played } : null,
        ].filter(Boolean),
        cta: { label: 'See standings', href: '/dashboard/standings#self-recap' },
      };
    },
    samples: [
      {
        name: 'Debut (night one)',
        payload: {
          handle: 'ArmenianMan',
          show_date: '2026-07-07',
          venue_name: 'Kohl Center',
          venue_city: 'Madison, WI',
          tour_rank: 1,
          total_tour_pickers: 11,
          tour_points: 10,
          is_debut: true,
          shows_played: 1,
          next_show_date: '2026-07-08',
          next_show_venue: 'United Center',
        },
      },
      {
        name: 'Late joiner',
        payload: {
          handle: 'LateBird',
          show_date: '2026-07-11',
          venue_name: 'Deer Creek',
          venue_city: 'Noblesville, IN',
          is_late_joiner: true,
          global_rank: 4,
          global_total_pickers: 28,
          tour_rank: 22,
          total_tour_pickers: 45,
          tour_points: 12,
          shows_played: 1,
          next_show_date: '2026-07-12',
          next_show_venue: 'Alpine Valley',
        },
      },
      {
        name: 'Climbed (outside top 5)',
        payload: {
          handle: 'drgluhanick',
          show_date: '2026-07-18',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          tour_rank: 12,
          total_tour_pickers: 312,
          tour_points: 410,
          rank_change: 'up 3',
          shows_played: 5,
          next_show_date: '2026-07-20',
          next_show_venue: 'MSG',
        },
      },
      {
        name: 'Climbed into top 5',
        payload: {
          handle: 'HotDogBilly',
          show_date: '2026-07-18',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          tour_rank: 4,
          total_tour_pickers: 312,
          tour_points: 455,
          rank_change: 'up 2',
          shows_played: 5,
          next_show_date: '2026-07-20',
          next_show_venue: 'MSG',
        },
      },
      {
        name: 'Slipped (ArmenianMan)',
        payload: {
          handle: 'ArmenianMan',
          show_date: '2026-07-08',
          venue_name: 'Kohl Center',
          venue_city: 'Madison, WI',
          tour_rank: 6,
          total_tour_pickers: 11,
          tour_points: 15,
          rank_change: 'down 5',
          shows_played: 2,
          global_rank: 8,
          global_total_pickers: 11,
          next_show_date: '2026-07-09',
          next_show_venue: 'United Center',
        },
      },
      {
        name: 'Held',
        payload: {
          handle: 'I have the book',
          show_date: '2026-07-18',
          venue_city: 'New York, NY',
          tour_rank: 8,
          total_tour_pickers: 312,
          tour_points: 380,
          rank_change: 'held',
          shows_played: 5,
          next_show_date: '2026-07-20',
          next_show_venue: 'MSG',
        },
      },
      {
        name: 'Leader (solo)',
        payload: {
          handle: 'RiverTranced',
          show_date: '2026-07-18',
          venue_city: 'New York, NY',
          tour_rank: 1,
          total_tour_pickers: 312,
          tour_points: 520,
          rank_change: 'held',
          shows_played: 5,
          next_show_date: '2026-07-20',
          next_show_venue: 'MSG',
        },
      },
      {
        name: 'Tied leader',
        payload: {
          handle: 'RiverTranced',
          show_date: '2026-07-18',
          venue_city: 'Chicago, IL',
          tour_rank: 1,
          total_tour_pickers: 40,
          tour_points: 80,
          rank_change: 'held',
          tour_rank_tied: true,
          tour_tied_count: 2,
          shows_played: 3,
          next_show_date: '2026-07-19',
          next_show_venue: 'Alpine Valley',
        },
      },
      {
        name: 'Tied mid-pack',
        payload: {
          handle: 'CouchTourPat',
          show_date: '2026-07-18',
          venue_city: 'Philadelphia, PA',
          tour_rank: 9,
          total_tour_pickers: 40,
          tour_points: 55,
          rank_change: 'down 1',
          tour_rank_tied: true,
          tour_tied_count: 3,
          shows_played: 4,
        },
      },
    ],
  },

  'picks-lock-reminder': {
    triggerId: 'picks_lock_reminder',
    displayName: 'Lock reminder',
    build: (p) => {
      const timeToLock = p.time_to_lock || 'A few hours';
      return {
        icon: AlarmClock,
        accentClassName: 'text-rose-300',
        eyebrow: 'Picks lock soon',
        title: `${timeToLock} until picks lock`,
        paragraphs: [
          `${handleOf(p)}, lock in your picks${venueLine(p) ? ` for ${venueLine(p)}` : ''}.`,
          isPicksSecured(p)
            ? 'Your picks are on the board — open them any time before lock to tweak.'
            : "You haven't locked picks yet. Don't get shut out of the night.",
        ],
        cta: isPicksSecured(p)
          ? { ...VIEW_EDIT_PICKS_CTA }
          : { label: 'Make your picks', href: PICKS_HREF },
      };
    },
    samples: [
      {
        name: 'Lock reminder',
        payload: {
          handle: 'HotDogBilly',
          show_date: 'Tonight',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          time_to_lock: '3 hours',
          lock_time_local: '7:30 PM',
        },
      },
      {
        name: 'Lock reminder — secured',
        payload: {
          handle: 'HotDogBilly',
          show_date: 'Tonight',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          time_to_lock: '3 hours',
          lock_time_local: '7:30 PM',
          picks_secured: true,
        },
      },
    ],
  },

  'tour-engagement-reminder': {
    triggerId: 'tour_engagement_reminder',
    displayName: 'Tour reminder',
    build: (p) => ({
      icon: Sparkles,
      accentClassName: 'text-violet-300',
      eyebrow: 'Keep the run going',
      title: 'Don’t stop now',
      paragraphs: [
        `${handleOf(p)}, you${p.show_score != null ? ` put up ${p.show_score} in your first show` : ' are off to a great start'}${
          p.global_rank != null ? ` (currently #${p.global_rank} overall)` : ''
        }.`,
        p.shows_remaining != null
          ? `There ${p.shows_remaining === 1 ? 'is' : 'are'} ${p.shows_remaining} show${p.shows_remaining === 1 ? '' : 's'} left this tour — every night is a chance to climb.`
          : 'There’s a whole tour ahead — every night is a chance to climb.',
        p.next_show_date
          ? `Next up: ${venueLine(p, { dateKey: 'next_show_date', venueKey: 'next_show_venue', cityKey: '__none' })}.`
          : '',
      ].filter(Boolean),
      cta: isPicksSecured(p)
        ? { ...VIEW_EDIT_PICKS_CTA }
        : { label: 'Make picks for next show', href: PICKS_HREF },
    }),
    samples: [
      {
        name: 'After first show',
        payload: {
          handle: 'I have the book',
          show_score: 65,
          global_rank: 18,
          global_total_pickers: 312,
          tour_name: 'Summer Tour 2026',
          shows_remaining: 8,
          next_show_date: 'Jul 20',
          next_show_venue: 'MSG',
        },
      },
      {
        name: 'After first show — next show secured',
        payload: {
          handle: 'I have the book',
          show_score: 65,
          global_rank: 18,
          global_total_pickers: 312,
          tour_name: 'Summer Tour 2026',
          shows_remaining: 8,
          next_show_date: 'Jul 20',
          next_show_venue: 'MSG',
          picks_secured: true,
        },
      },
    ],
  },

  [SPHERE_2026_RECAP_ID]: {
    triggerId: 'tour_recap_sphere_2026',
    displayName: "Sphere 2026 recap",
    Component: Sphere2026TourRecapInApp,
    toComponentProps: (p) => {
      const num = (v, f = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : f;
      };
      return {
        rank: num(p.rank),
        points: num(p.points),
        wins: num(p.wins),
        showsPlayed: num(p.showsPlayed),
        ...(p.participantCount != null ? { participantCount: num(p.participantCount) } : {}),
      };
    },
    samples: [
      {
        name: 'Champion',
        payload: { rank: 1, points: 160, wins: 4, showsPlayed: 9, participantCount: 23 },
      },
      {
        name: 'Top 10',
        payload: { rank: 7, points: 120, wins: 1, showsPlayed: 9, participantCount: 23 },
      },
    ],
  },
};

/**
 * @param {string} templateId
 * @returns {CommsTemplateEntry | undefined}
 */
export function getCommsTemplateEntry(templateId) {
  return COMMS_TEMPLATE_REGISTRY[templateId];
}

/** Catalog triggerId for a template (for analytics dimensions). */
export function triggerIdForTemplate(templateId) {
  return COMMS_TEMPLATE_REGISTRY[templateId]?.triggerId;
}

export function listCommsTemplateIds() {
  return Object.keys(COMMS_TEMPLATE_REGISTRY);
}
