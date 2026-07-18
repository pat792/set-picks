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

const { buildTourRankingsDailyParagraphs } = require("./tourRankingsDailyCore");
const {
  buildInviteShareHtmlBlock,
  buildInviteSharePlainTextLines,
} = require("./comms/inviteShareBlock.cjs");
const { resolveCommsEmailHeader } = require("./comms/emailCommsHeader.cjs");

const SITE_URL = "https://www.setlistpickem.com";
const APP_CTA_URL = `${SITE_URL}/dashboard`;
const PICKS_CTA_URL = `${SITE_URL}/dashboard/picks`;
const STANDINGS_CTA_URL = `${SITE_URL}/dashboard/standings#self-recap`;

function handleOf(p) {
  const h = p && typeof p.handle === "string" ? p.handle.trim() : "";
  return h || "Picker";
}

/**
 * Readable night scorecard sentence (words around variables, not a comma list).
 * e.g. present: "You scored 70 points and are now ranked #4 of 200 globally, with 3 of 6 picks hitting."
 * e.g. past (morning daily): "…and were ranked #4 of 200 globally…" — night rank is prior night.
 *
 * @param {Record<string, unknown>} p
 * @param {{ rankScope?: string, rankTense?: "present" | "past" }} [opts]
 * @returns {string} Full sentence including trailing period, or "" if nothing to say.
 */
function buildShowScorecardSentence(
  p,
  { rankScope = "globally", rankTense = "present" } = {}
) {
  /** @type {string[]} */
  const lead = [];
  if (p.show_score != null) {
    lead.push(`scored ${p.show_score} points`);
  }
  if (p.global_rank != null) {
    const of =
      p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : "";
    // Morning `tour_rankings_daily` looks back at last night → past tense.
    // Night-of `show_recap` keeps present ("are now ranked").
    lead.push(
      rankTense === "past"
        ? `were ranked #${p.global_rank}${of} ${rankScope}`
        : `are now ranked #${p.global_rank}${of} ${rankScope}`
    );
  }

  let sentence = "";
  if (lead.length === 1) {
    sentence = `You ${lead[0]}`;
  } else if (lead.length >= 2) {
    sentence = `You ${lead[0]} and ${lead[1]}`;
  }

  if (p.correct_picks_count != null) {
    const total = p.total_picks_count != null ? p.total_picks_count : 6;
    const hits = `with ${p.correct_picks_count} of ${total} picks hitting`;
    sentence = sentence ? `${sentence}, ${hits}` : `You had ${p.correct_picks_count} of ${total} picks hitting`;
  }

  if (p.bustout_bonus) {
    const bonus = `a bustout bonus of +${p.bustout_bonus}`;
    sentence = sentence ? `${sentence}, plus ${bonus}` : `You earned ${bonus}`;
  }

  return sentence ? `${sentence}.` : "";
}

/**
 * Show-scoped picks CTA (#535). Appends `?showDate=YYYY-MM-DD` when payload has
 * a calendar date (ignores display labels like "Tonight").
 *
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function picksCtaUrl(p) {
  const raw = p && typeof p.show_date === "string" ? p.show_date.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${PICKS_CTA_URL}?showDate=${encodeURIComponent(raw)}`;
  }
  return PICKS_CTA_URL;
}

/**
 * @param {string} venue
 * @param {string} city
 * @returns {string}
 */
function appendCityIfNeeded(venue, city) {
  if (!city) return venue;
  if (!venue) return city;
  if (venue.toLowerCase().includes(city.toLowerCase())) return venue;
  return `${venue}, ${city}`;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ dateKey?: string, venueKey?: string, cityKey?: string }} [opts]
 * @returns {string}
 */
function venueLine(payload, { dateKey = "show_date", venueKey = "venue_name", cityKey = "venue_city" } = {}) {
  const venue = typeof payload?.[venueKey] === "string" ? payload[venueKey].trim() : "";
  const city =
    cityKey && cityKey !== "__none" && typeof payload?.[cityKey] === "string"
      ? payload[cityKey].trim()
      : "";
  const place = appendCityIfNeeded(venue, city);
  const date = typeof payload?.[dateKey] === "string" ? payload[dateKey].trim() : "";
  if (date && place) return `${date} — ${place}`;
  return place || date || "";
}

/** Warm default close — avoid repeating the brand name (logo + legal footer cover identity). */
const DEFAULT_EMAIL_SIGN_OFF = "See you on tour!";

/**
 * Service comms email copy contract:
 * - Body = personalized message only (no prefs/legal/sign-off boilerplate).
 * - Plain-text part appends `Open the app:` (no HTML button in text clients).
 * - HTML shell renders sign-off separately; prefs live in the footer links only.
 *
 * @param {string[]} bodyLines
 * @param {{ signOff?: string, ctaUrl?: string }} [opts]
 */
function assembleServiceEmail(bodyLines, { signOff = DEFAULT_EMAIL_SIGN_OFF, ctaUrl = APP_CTA_URL } = {}) {
  const signOffLine = String(signOff || DEFAULT_EMAIL_SIGN_OFF).trim();
  /** @type {string[]} */
  const cleaned = [];
  for (const line of bodyLines || []) {
    if (line === "") {
      // Preserve intentional paragraph breaks (blank lines between blocks).
      if (cleaned.length && cleaned[cleaned.length - 1] !== "") cleaned.push("");
      continue;
    }
    if (line) cleaned.push(String(line));
  }
  while (cleaned.length && cleaned[cleaned.length - 1] === "") cleaned.pop();
  const text = [
    ...cleaned,
    "",
    `Open the app: ${ctaUrl}`,
    "",
    signOffLine,
  ].join("\n");
  return { text, signOff: signOffLine, ctaUrl };
}

/** @type {Record<string, (payload: Record<string, any>) => { push: {title:string,body:string}, email: {subject:string,text:string} }>} */
const BUILDERS = {
  "account-welcome": (p) => {
    const nextShowLine = p.next_show_date
      ? `Your next chance to play: ${p.next_show_date}${p.next_show_venue ? ` at ${p.next_show_venue}` : ""}.`
      : "";
    const assembled = assembleServiceEmail(
      [
        `Welcome, ${handleOf(p)}!`,
        "",
        [
          "Joining the community means you get to track every show of every tour. Invite friends to play in a Private Pool, or just stick with competing against all who play a given night. We are so excited you're here, and hope you'll spread the word.",
          nextShowLine,
        ]
          .filter(Boolean)
          .join(" "),
      ],
      { signOff: "Glad you're here — see you at the next show!" }
    );
    return {
      push: {
        title: "Welcome to Setlist Pick'em",
        body: `${handleOf(p)}, make your first picks and get on the board.`,
      },
      email: {
        subject: "Welcome to Setlist Pick'em",
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: assembled.ctaUrl,
      },
    };
  },

  "tour-countdown": (p) => {
    const days = Number(p.days_remaining);
    const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    const firstShow = venueLine(p, {
      dateKey: "first_show_date",
      venueKey: "first_show_venue",
      cityKey: "first_show_city",
    });
    const assembled = assembleServiceEmail(
      [
        `${handleOf(p)}, the run kicks off ${when}.`,
        firstShow ? `First show: ${firstShow}.` : "",
        "Get your picks ready before the first downbeat.",
      ],
      { ctaUrl: PICKS_CTA_URL }
    );
    return {
      push: {
        title: `${p.tour_name || "The tour"} starts ${when}`,
        body: "Get your picks ready for the first show.",
      },
      email: {
        subject: `${p.tour_name || "The tour"} starts ${when}`,
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: PICKS_CTA_URL,
        ctaLabel: "Make Your Picks",
      },
    };
  },

  "picks-confirmed": (p) => {
    const assembled = assembleServiceEmail(
      [
        `${handleOf(p)}, your picks for ${p.show_date || ""}${p.venue_name ? ` at ${p.venue_name}` : ""} are confirmed.`,
        "We'll score them live as the setlist comes in.",
      ],
      { signOff: "Good luck tonight!" }
    );
    return {
      push: {
        title: "You're locked in",
        body: `Picks for ${p.venue_name || p.show_date || "the show"} are confirmed. We'll score them live.`,
      },
      email: {
        subject: "Your picks are locked in",
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: assembled.ctaUrl,
      },
    };
  },

  "score-first-points": (p) => {
    const assembled = assembleServiceEmail([
      `${handleOf(p)}, your first pick just scored${
        p.points_earned != null ? ` (+${p.points_earned} points)` : ""
      }.`,
    ]);
    return {
      push: {
        title: "You just scored!",
        body: p.song_name
          ? `"${p.song_name}" hit — you're on the board${
              p.points_earned != null ? ` (+${p.points_earned} points)` : ""
            }.`
          : "Your first pick of the night landed.",
      },
      email: {
        subject: "You're on the board",
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: assembled.ctaUrl,
      },
    };
  },

  "score-leader": (p) => {
    const assembled = assembleServiceEmail([
      `${handleOf(p)}, you're now ranked #1 on ${
        p.leaderboard_name || "the Global"
      } leaderboard${
        p.lead_margin != null ? ` — ahead by ${p.lead_margin} points` : ""
      }.`,
    ]);
    return {
      push: {
        title: `You're #1 on ${p.leaderboard_name || "the leaderboard"}`,
        body: `You took the top spot${
          p.lead_margin != null ? ` by ${p.lead_margin} points` : ""
        }. Can you hold it?`,
      },
      email: {
        subject: `You took the lead on ${p.leaderboard_name || "the leaderboard"}`,
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: assembled.ctaUrl,
      },
    };
  },

  "show-recap": (p) => {
    const handle = handleOf(p);
    const where = `${p.show_date || "the show"}${p.venue_name ? ` at ${p.venue_name}` : ""}`;
    const narrative =
      (typeof p.narrative_line === "string" && p.narrative_line.trim()) ||
      (typeof p.setlist_highlight === "string" && p.setlist_highlight.trim()) ||
      "";
    const scoreSentence = buildShowScorecardSentence(p, { rankScope: "globally" });
    const para = [
      `${handle}, here's how your picks for ${where} graded out.`,
      narrative,
      scoreSentence,
    ]
      .filter(Boolean)
      .join(" ");
    const assembled = assembleServiceEmail([para], { ctaUrl: STANDINGS_CTA_URL });
    const pushBodyBits = [
      narrative,
      p.show_score != null ? `You scored ${p.show_score} points.` : "",
      p.global_rank != null
        ? `You're now ranked #${p.global_rank}${
            p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ""
          } globally.`
        : "",
      "Open for the full breakdown.",
    ].filter(Boolean);
    return {
      push: {
        title: p.venue_name ? `Recap: ${p.venue_name}` : "Your show recap is in",
        body: pushBodyBits.join(" "),
      },
      email: {
        subject: p.venue_name ? `Your recap: ${p.venue_name}` : "Your show recap",
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: STANDINGS_CTA_URL,
      },
    };
  },

  "tour-rankings-daily": (p) => {
    const handle = handleOf(p);
    const venue = venueLine(p) || "the show";
    const narrative =
      (typeof p.narrative_line === "string" && p.narrative_line.trim()) ||
      (typeof p.setlist_highlight === "string" && p.setlist_highlight.trim()) ||
      "";

    const nightPara = [
      `${handle}, here's how last night at ${venue} went.`,
      narrative,
      buildShowScorecardSentence(p, {
        rankScope: "globally",
        rankTense: "past",
      }),
    ]
      .filter(Boolean)
      .join(" ");

    // Tour paragraph — reuse existing branch lines, joined into prose.
    // Handle already greets in nightPara — omit it here for email.
    const tourPara = buildTourRankingsDailyParagraphs(p, {
      omitHandle: true,
    }).join(" ");

    // Blank line between paras → separate HTML <p> tags. Soft invite nudge lives
    // in inviteBlockHtml + plain-text appendix (stripped from HTML body).
    const assembled = assembleServiceEmail([nightPara, "", tourPara], {
      ctaUrl: PICKS_CTA_URL,
    });
    const standingsShareUrl = `${SITE_URL}/dashboard/standings?utm_source=email&utm_campaign=tour_rankings_daily&utm_content=share_nudge`;
    const inviteFields = {
      standingsUrl: standingsShareUrl,
      ctaLabel: "Open Standings to share →",
    };
    const invitePlain = buildInviteSharePlainTextLines(inviteFields);
    const emailText = `${assembled.text}\n\n${invitePlain.join("\n")}`;

    const pushRank =
      p.tour_rank != null
        ? p.tour_rank_tied
          ? `tied #${p.tour_rank}`
          : `#${p.tour_rank}`
        : null;

    return {
      push: {
        title: "Where you stand on tour",
        body: `${pushRank != null ? `${pushRank} on tour` : "New standings are in"}${
          p.tour_points != null ? ` · ${p.tour_points} pts` : ""
        }${p.rank_change ? ` (${p.rank_change})` : ""}.`,
      },
      email: {
        subject: "Your show recap + tour standings",
        text: emailText,
        signOff: assembled.signOff,
        ctaUrl: PICKS_CTA_URL,
        ctaLabel: "Make picks for next show",
        inviteBlockHtml: buildInviteShareHtmlBlock(inviteFields),
      },
    };
  },

  "picks-lock-reminder": (p) => {
    const timeToLock = p.time_to_lock || "a few hours";
    const ctaUrl = picksCtaUrl(p);
    const assembled = assembleServiceEmail(
      [
        `${handleOf(p)}, ${timeToLock} until picks lock${
          p.venue_name ? ` for ${p.venue_name}` : ""
        }.`,
        "You haven't locked picks yet — don't get shut out.",
      ],
      { ctaUrl, signOff: "See you on tour!" }
    );
    return {
      push: {
        title: `${timeToLock} until picks lock`,
        body: `Lock in your picks${p.venue_name ? ` for ${p.venue_name}` : ""}.`,
      },
      email: {
        subject: `${timeToLock} until picks lock${
          p.venue_city ? ` — ${p.venue_city} tonight` : ""
        }`,
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl,
        ctaLabel: "Make Your Picks",
      },
    };
  },

  "tour-engagement-reminder": (p) => {
    const assembled = assembleServiceEmail([
      `${handleOf(p)}, you're off to a great start${
        p.global_rank != null ? ` (currently ranked #${p.global_rank})` : ""
      }.`,
      p.shows_remaining != null ? `${p.shows_remaining} shows left this tour.` : "",
    ].filter(Boolean));
    return {
      push: {
        title: "Don't stop now",
        body: `${p.shows_remaining != null ? `${p.shows_remaining} shows left this tour. ` : ""}Every night is a chance to climb.`,
      },
      email: {
        subject: "Keep your run going",
        text: assembled.text,
        signOff: assembled.signOff,
        ctaUrl: assembled.ctaUrl,
      },
    };
  },
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
    : (() => {
        const assembled = assembleServiceEmail(["You have a new update."]);
        return {
          push: { title: "Setlist Pick'em", body: "You have a new update." },
          email: {
            subject: "Setlist Pick'em update",
            text: assembled.text,
            signOff: assembled.signOff,
            ctaUrl: assembled.ctaUrl,
          },
        };
      })();
  const header =
    channels.email.header || resolveCommsEmailHeader(templateId, payload);
  return {
    inApp: { templateId, payload },
    push: channels.push,
    email: header ? { ...channels.email, header } : channels.email,
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
