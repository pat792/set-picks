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

/**
 * In-app CTA for tour countdown — varies by `days_remaining` (TRIGGER_CATALOG.md §2).
 * Push/email may use "open the app" phrasing; in-app users are already in the app.
 * @param {Record<string, unknown>} p
 */
function tourCountdownInAppCta(p) {
  const days = Number(p.days_remaining);
  if (days === 10) {
    return { label: 'View upcoming shows', href: PICKS_HREF };
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
        "You're in. Setlist Pick'em is a prediction game for live shows — call the opener, closer, encore, and a wildcard, then watch the points roll in as the setlist unfolds.",
        p.next_show_date
          ? `Your next chance to play: ${venueLine(p, { dateKey: 'next_show_date', venueKey: 'next_show_venue', cityKey: '__none' })}. Lock in a few picks and you're on the board.`
          : 'Head to the dashboard, make your first set of picks, and you’re on the board.',
      ],
      cta: { label: 'Make your first picks', href: '/dashboard' },
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
            : 'Get your picks ready before the first downbeat.',
          `Picks lock at ${p.lock_time_local || '7:55 PM'} local on show night — don't get shut out.`,
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
          lock_time_local: '7:55 PM',
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
          lock_time_local: '7:55 PM',
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
          lock_time_local: '7:55 PM',
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
        cta: { label: 'Review your picks', href: '/dashboard' },
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
      cta: { label: 'Watch it live', href: '/dashboard' },
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
      cta: { label: 'Defend your lead', href: '/dashboard' },
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
    build: (p) => ({
      icon: BarChart3,
      accentClassName: 'text-teal-400',
      eyebrow: 'Show recap',
      title: p.venue_name ? `Recap: ${p.venue_name}` : 'Your show recap',
      paragraphs: [
        `${handleOf(p)}, here's how your picks for ${venueLine(p) || 'the show'} graded out.`,
        p.correct_picks_count != null && p.total_picks_count != null
          ? `You nailed ${p.correct_picks_count} of ${p.total_picks_count} picks.`
          : 'Tap through for the full breakdown.',
      ],
      stats: [
        p.show_score != null ? { label: 'Show score', value: p.show_score } : null,
        p.global_rank != null
          ? {
              label: 'Global rank',
              value: p.global_total_pickers != null ? `#${p.global_rank}/${p.global_total_pickers}` : `#${p.global_rank}`,
            }
          : null,
        p.pool_rank != null && p.pool_name
          ? { label: p.pool_name, value: `#${p.pool_rank}` }
          : null,
      ].filter(Boolean),
      cta: { label: 'See full recap', href: '/dashboard/standings' },
    }),
    samples: [
      {
        name: 'Graded show',
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
        },
      },
    ],
  },

  'tour-rankings-daily': {
    triggerId: 'tour_rankings_daily',
    displayName: 'Tour rankings',
    build: (p) => {
      const change = p.rank_change;
      const changeLabel =
        change === 'held' || change == null
          ? 'held your spot'
          : Number(change) > 0
            ? `climbed ${change}`
            : `slipped ${Math.abs(Number(change))}`;
      return {
        icon: TrendingUp,
        accentClassName: 'text-sky-300',
        eyebrow: 'Tour standings',
        title: 'Where you stand on tour',
        paragraphs: [
          `${handleOf(p)}, after ${p.venue_city || 'last night'} you ${changeLabel}.`,
          p.next_show_date
            ? `Next up: ${venueLine(p, { dateKey: 'next_show_date', venueKey: 'next_show_venue', cityKey: '__none' })}.`
            : 'Keep your streak going on the next show.',
        ],
        stats: [
          p.tour_rank != null
            ? {
                label: 'Tour rank',
                value: p.total_tour_pickers != null ? `#${p.tour_rank}/${p.total_tour_pickers}` : `#${p.tour_rank}`,
              }
            : null,
          p.tour_points != null ? { label: 'Tour points', value: p.tour_points } : null,
          p.shows_played != null ? { label: 'Shows', value: p.shows_played } : null,
        ].filter(Boolean),
        cta: { label: 'See standings', href: '/dashboard/standings' },
      };
    },
    samples: [
      {
        name: 'Climbed',
        payload: {
          handle: 'drgluhanick',
          show_date: 'Jul 18',
          venue_city: 'New York, NY',
          tour_rank: 6,
          total_tour_pickers: 312,
          tour_points: 410,
          rank_change: 3,
          shows_played: 5,
          next_show_date: 'Jul 20',
          next_show_venue: 'MSG',
        },
      },
    ],
  },

  'picks-lock-reminder': {
    triggerId: 'picks_lock_reminder',
    displayName: 'Lock reminder',
    build: (p) => ({
      icon: AlarmClock,
      accentClassName: 'text-rose-300',
      eyebrow: 'Picks lock soon',
      title: 'Lock in your picks',
      paragraphs: [
        `${handleOf(p)}, ${venueLine(p) || "tonight's show"} locks at ${p.lock_time_local || '7:55 PM'} local${
          p.time_to_lock ? ` — about ${p.time_to_lock} away` : ''
        }.`,
        "You haven't locked picks yet. Don't get shut out of the night.",
      ],
      cta: { label: 'Make your picks', href: '/dashboard' },
    }),
    samples: [
      {
        name: 'Lock reminder',
        payload: {
          handle: 'HotDogBilly',
          show_date: 'Tonight',
          venue_name: 'MSG',
          venue_city: 'New York, NY',
          time_to_lock: '2 hours',
          lock_time_local: '7:55 PM',
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
      cta: { label: 'Make picks for next show', href: PICKS_HREF },
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
