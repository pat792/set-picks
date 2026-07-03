/**
 * Server-side comms template rendering (DELIVER layer).
 *
 * For each `templateId` this produces the channel payloads the workers need:
 *  - `inApp`: `{ templateId, payload }` (the SPA renders the rich body via the
 *    in-app template registry — we just persist the variables).
 *  - `push`:  `{ title, body }` (short teaser, deep-links to the inbox).
 *  - `email`: `{ subject, text }` (teaser + CTA back into the app).
 *
 * Copy mirrors `docs/comms-triggers/catalog.json` variables. Push stays short;
 * email is the abbreviated teaser pattern (full narrative lives in-app).
 */

"use strict";

const SITE_URL = "https://www.setlistpickem.com";
const APP_CTA_URL = `${SITE_URL}/dashboard`;

function handleOf(p) {
  const h = p && typeof p.handle === "string" ? p.handle.trim() : "";
  return h || "Picker";
}

function emailFooter() {
  return [
    "",
    `Open the app: ${APP_CTA_URL}`,
    "",
    "Manage which updates you get in Notifications settings.",
    "— Setlist Pick'em",
  ];
}

/** @type {Record<string, (payload: Record<string, any>) => { push: {title:string,body:string}, email: {subject:string,text:string} }>} */
const BUILDERS = {
  "account-welcome": (p) => ({
    push: {
      title: "Welcome to Setlist Pick'em",
      body: `${handleOf(p)}, make your first picks and get on the board.`,
    },
    email: {
      subject: "Welcome to Setlist Pick'em",
      text: [
        `Welcome, ${handleOf(p)}!`,
        "",
        "Setlist Pick'em is a prediction game for live shows — call the opener, closer, encore, and a wildcard, then rack up points as the setlist unfolds.",
        p.next_show_date ? `Your next chance to play: ${p.next_show_date}${p.next_show_venue ? ` at ${p.next_show_venue}` : ""}.` : "",
        ...emailFooter(),
      ].filter(Boolean).join("\n"),
    },
  }),

  "tour-countdown": (p) => {
    const days = Number(p.days_remaining);
    const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    return {
      push: {
        title: `${p.tour_name || "The tour"} starts ${when}`,
        body: `Get your picks ready — locks at ${p.lock_time_local || "7:55 PM"} local.`,
      },
      email: {
        subject: `${p.tour_name || "The tour"} starts ${when}`,
        text: [
          `${handleOf(p)}, the run kicks off ${when}.`,
          p.first_show_venue ? `First show: ${p.first_show_date || ""} ${p.first_show_venue}${p.first_show_city ? `, ${p.first_show_city}` : ""}.` : "",
          `Picks lock at ${p.lock_time_local || "7:55 PM"} local on show night.`,
          ...emailFooter(),
        ].filter(Boolean).join("\n"),
      },
    };
  },

  "picks-confirmed": (p) => ({
    push: {
      title: "You're locked in",
      body: `Picks for ${p.venue_name || p.show_date || "the show"} are confirmed. We'll score them live.`,
    },
    email: {
      subject: "Your picks are locked in",
      text: [
        `${handleOf(p)}, your picks for ${p.show_date || ""}${p.venue_name ? ` at ${p.venue_name}` : ""} are confirmed.`,
        "We'll score them live as the setlist comes in.",
        ...emailFooter(),
      ].filter(Boolean).join("\n"),
    },
  }),

  "score-first-points": (p) => ({
    push: {
      title: "You just scored!",
      body: p.song_name ? `"${p.song_name}" hit — you're on the board${p.points_earned != null ? ` (+${p.points_earned})` : ""}.` : "Your first pick of the night landed.",
    },
    email: {
      subject: "You're on the board",
      text: [
        `${handleOf(p)}, your first pick just scored${p.points_earned != null ? ` (+${p.points_earned} pts)` : ""}.`,
        ...emailFooter(),
      ].join("\n"),
    },
  }),

  "score-leader": (p) => ({
    push: {
      title: `You're #1 on ${p.leaderboard_name || "the leaderboard"}`,
      body: `You took the top spot${p.lead_margin != null ? ` by ${p.lead_margin}` : ""}. Can you hold it?`,
    },
    email: {
      subject: `You took the lead on ${p.leaderboard_name || "the leaderboard"}`,
      text: [
        `${handleOf(p)}, you're #1 on ${p.leaderboard_name || "the Global"} leaderboard.`,
        ...emailFooter(),
      ].join("\n"),
    },
  }),

  "show-recap": (p) => ({
    push: {
      title: p.venue_name ? `Recap: ${p.venue_name}` : "Your show recap is in",
      body: `${p.show_score != null ? `You scored ${p.show_score}. ` : ""}${p.global_rank != null ? `#${p.global_rank} overall. ` : ""}Open for the full breakdown.`,
    },
    email: {
      subject: p.venue_name ? `Your recap: ${p.venue_name}` : "Your show recap",
      text: [
        `${handleOf(p)}, here's how your picks for ${p.show_date || "the show"}${p.venue_name ? ` at ${p.venue_name}` : ""} graded out.`,
        p.show_score != null ? `Show score: ${p.show_score}.` : "",
        p.global_rank != null ? `Global rank: #${p.global_rank}${p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ""}.` : "",
        ...emailFooter(),
      ].filter(Boolean).join("\n"),
    },
  }),

  "tour-rankings-daily": (p) => ({
    push: {
      title: "Where you stand on tour",
      body: `${p.tour_rank != null ? `#${p.tour_rank} on tour` : "New standings are in"}${p.tour_points != null ? ` · ${p.tour_points} pts` : ""}.`,
    },
    email: {
      // Absorbs show_recap's "your night" content (#451) so a user gets one
      // email per (uid, showDate) instead of two on the common single-tour-
      // night path — the dominant same-day email fatigue collision.
      subject: p.venue_city
        ? `Your ${p.venue_city} recap + tour update`
        : "Your show recap + tour standings",
      text: [
        `${handleOf(p)}, here's how last night at ${p.venue_name || p.venue_city || "the show"} went.`,
        p.show_score != null ? `Show score: ${p.show_score}.` : "",
        p.global_rank != null ? `Global rank: #${p.global_rank}${p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ""}.` : "",
        p.correct_picks_count != null ? `Correct picks: ${p.correct_picks_count}${p.total_picks_count != null ? ` of ${p.total_picks_count}` : ""}.` : "",
        "",
        `Now ${p.tour_rank != null ? `#${p.tour_rank}` : "on the board"}${p.total_tour_pickers != null ? ` of ${p.total_tour_pickers}` : ""} on tour${p.tour_points != null ? ` with ${p.tour_points} pts` : ""}${p.rank_change ? ` (${p.rank_change})` : ""}.`,
        p.next_show_venue ? `Next show: ${p.next_show_date || ""} ${p.next_show_venue}.`.trim() : "",
        ...emailFooter(),
      ].filter(Boolean).join("\n"),
    },
  }),

  "picks-lock-reminder": (p) => ({
    push: {
      title: "Tonight's picks lock soon",
      body: `Lock in your picks${p.venue_name ? ` for ${p.venue_name}` : ""} before ${p.lock_time_local || "7:55 PM"} local.`,
    },
    email: {
      subject: "Lock in your picks",
      text: [
        `${handleOf(p)}, ${p.venue_name || "tonight's show"} locks at ${p.lock_time_local || "7:55 PM"} local.`,
        "You haven't locked picks yet — don't get shut out.",
        ...emailFooter(),
      ].join("\n"),
    },
  }),

  "tour-engagement-reminder": (p) => ({
    push: {
      title: "Don't stop now",
      body: `${p.shows_remaining != null ? `${p.shows_remaining} shows left this tour. ` : ""}Every night is a chance to climb.`,
    },
    email: {
      subject: "Keep your run going",
      text: [
        `${handleOf(p)}, you're off to a great start${p.global_rank != null ? ` (currently #${p.global_rank})` : ""}.`,
        p.shows_remaining != null ? `${p.shows_remaining} shows left this tour.` : "",
        ...emailFooter(),
      ].filter(Boolean).join("\n"),
    },
  }),
};

/**
 * Render channel payloads for a template.
 *
 * @param {string} templateId
 * @param {Record<string, unknown>} payload
 * @returns {Promise<{ inApp: { templateId: string, payload: Record<string, unknown> }, push: { title: string, body: string }, email: { subject: string, text: string, html?: string, ctaUrl?: string } }>}
 */
async function renderCommsTemplate(templateId, payload = {}) {
  if (templateId === "summer-tour-2026-launch") {
    // Lazy: marketing bundle is gitignored and only needed for this templateId.
    // eslint-disable-next-line global-require
    const { buildSummerTour2026LaunchChannels } = require("./marketingCommsTemplates");
    const channels = await buildSummerTour2026LaunchChannels(payload);
    return {
      inApp: { templateId, payload },
      push: channels.push,
      email: channels.email,
    };
  }

  const builder = BUILDERS[templateId];
  const channels = builder
    ? builder(payload)
    : {
        push: { title: "Setlist Pick'em", body: "You have a new update." },
        email: {
          subject: "Setlist Pick'em update",
          text: ["You have a new update.", ...emailFooter()].join("\n"),
        },
      };
  return {
    inApp: { templateId, payload },
    push: channels.push,
    email: channels.email,
  };
}

function hasTemplate(templateId) {
  if (templateId === "summer-tour-2026-launch") return true;
  return Object.prototype.hasOwnProperty.call(BUILDERS, templateId);
}

module.exports = {
  renderCommsTemplate,
  hasTemplate,
  APP_CTA_URL,
  SITE_URL,
};
