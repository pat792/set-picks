# Summer Tour 2026 — pre-opener marketing launch

| Field | Value |
|-------|-------|
| **templateId** | `summer-tour-2026-launch` |
| **triggerId** | `marketing_summer_tour_2026_launch` |
| **campaignId** | `summer_tour_2026` |
| **implementationModule** | `src/features/marketing-comms/model/summerTour2026Launch.js` |
| **React Email** | `emails/src/templates/SummerTour2026Launch.jsx` |
| **Channels** | emailFull only |
| **GitHub** | #468 |

## Audience

- **Sphere alum** — graded, non-empty picks on any Sphere Run date
- **Post-Sphere signup** — `users.createdAt` on/after 2026-04-16 (Sphere go-live)
- **Both** — users in both cohorts get the Sphere-alum intro

## Placeholders

- `{{greeting_name}}` — from `users/{uid}.handle`, fallback `friend`
- `{{audience_segment}}` — `sphere_alum` \| `post_sphere_signup` \| `sphere_alum_and_new`
- `{{opener_label}}` — `Tuesday, July 7` (2026-07-07 Madison opener)
- `{{share_url}}` — `/join/{inviteCode}` when user has a pool, else `/` (+ UTM)
- `{{install_howto_url}}` — `/dashboard?install=1` (+ UTM) for home screen + push instructions (legacy `/dashboard/profile?…install_howto` redirects here)

## Email — full (founder letter)

**Subject:** Summer Tour's almost here — bring your crew →

**Preview:** Bring your crew → Summer Tour starts Tuesday, July 7.

### Opening (segment variants)

**Sphere alum (`sphere_alum`, `sphere_alum_and_new`):**

Hey {{greeting_name}},

Summer Tour opens {{opener_label}}. Thanks for playing and testing during Sphere — real-time scoring with friends near and far was a blast.

Since then I've been busy building. I hope Summer tour feels even better than last time.

**Post-Sphere signup (`post_sphere_signup`):**

Hey {{greeting_name}},

Summer Tour opens {{opener_label}}. Welcome — glad you're here.

Pick opener, closer, encore, and a wildcard; points rack up as the setlist lands. A lot's new since you joined — hope your first show is a good one.

### What's new (shared)

1. **Home screen + push** — One-tap launch from your home screen, plus push notifications to keep you updated on show nights — works in the browser or as an installed app. Link: See how it works in the app → (`/dashboard?install=1`)
2. **Share your night (Wordle-style)** — emoji grid, recap image, one-tap share after scores land.
3. **Rank + standings that tell the story** — #rank · points, pool/tour flips; opponent picks hidden pre-lock.
4. **Pools that are easy to fill** — invite links that preview in iMessage and social.

Also tighter since beta: live scoring speed, public profiles, smoother sign-in, app-update banner.

Would love to see you — and your tour friends — on the board all summer.

— Pat

**Primary CTA:** Share with your friends, {{greeting_name}} → (`/join/{code}` or `/` + UTM)

## Delivery

- Callable: `deliverMarketingSummerTour2026Launch` (dryRun default true)
- CLI: `node functions/scripts/deliverMarketingSummerTour2026Launch.js [--execute] [--uid <uid>]`
