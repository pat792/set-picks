# Tour countdown

| Field | Value |
|-------|-------|
| **templateId** | `tour-countdown` |
| **triggerId** | `tour_countdown` |
| **implementationModule** | `functions/commsTemplates.js` (email, push) and `src/features/notifications/ui/commsTemplates/commsTemplateRegistry.jsx` (in-app). Email on/off is `tourCountdownIncludesEmail` in `functions/commsTemplates.js`, applied by `functions/commsEventAdapters.js` and `functions/tourCountdownRecoveryDelivery.js`. |
| **Channels** | inApp and push on every beat. Email only where the cadence table says so. |
| **Status** | locked |
| **Date** | 2026-09-30 |
| **Discussion** | Product decision 2026-09-30. Send policy replaces investigation option B. Duplicate-account and blank-card notes stay in `docs/comms-triggers/INVESTIGATION_2026-09-27_tour_countdown_picks.md`. |

## Objective

Email is the scarce channel. Push and in-app carry every beat, for an empty card and for a card that is already in, with different closing lines from T-5 on.

`picks_secured` means the opener card for `first_show_date` is non-empty. Do not name a clock. `lock_time_local` on this payload is not the real cutoff. The show-day lock reminder owns that, and it already skips anyone with picks.

| Beat | Empty card | Picks in |
|------|------------|----------|
| T-10 | Push + in-app | Push + in-app |
| T-5 | Email + push + in-app | Push + in-app |
| T-3 | Push + in-app | Push + in-app |
| T-1 | Email + push + in-app | Push + in-app |
| Show day | Lock email (`picks_lock_reminder`, already shipped) | Nothing |

Empty card: three emails (T-5, T-1, lock). Picks in: no email from this series, and no lock email.

T-10 uses one line for everyone. Picks are not the job yet. T-5, T-3, and T-1 use a second line when the card is in.

## Shared lines (every send)

**Subject / push title:** `{{tour_name}} starts {{when}}`  
`{{when}}` is `in N days`, `tomorrow`, or `today`.

**Opening:** `{{handle}}, the run kicks off {{when}}.`

**First show:** `First show: {{first_show_date}} — {{first_show_venue}}.` City is appended only when it is not already in the venue string.

**Sign-off:** `See you on tour!`

**Email button** (only on beats that email)

| Branch | Label |
|--------|-------|
| Empty card | `Make Your Picks` |
| Picks in | Not emailed. The label `View / Edit picks` stays in the builder and is unused. |

Both go to `/dashboard/picks`.

**In-app button**

| Days | Empty card | Picks in |
|------|------------|----------|
| `10` | `View upcoming shows` | `View upcoming shows` |
| `5` / `3` | `Make picks for show 1` | `View / Edit picks` |
| `1` | `Lock in your picks` | `View / Edit picks` |

## Closing line

Push body and the in-app close are this line. Email uses it only when that beat emails.

### Empty card (and all T-10)

| Days | Close |
|------|-------|
| `10` | Gear up for the tour opener. Worth sketching your six calls now. |
| `5` | Show 1 picks are open. Lock your six slots when you have them. |
| `3` | There's still time to fill your card for show 1. |
| `1` | Have your card filled before they walk on. |

### Picks in (T-5 / T-3 / T-1)

`{{showtime}}` is `showtime on {{first_show_date}}`, or `showtime` when the date is missing. These lines go out on push and in-app. They are not emailed.

| Days | Close |
|------|-------|
| `5` | Your opener picks are in. You can edit them up to {{showtime}}. |
| `3` | Your card for show 1 is already in. Edit it any time before {{showtime}}. |
| `1` | You're locked in for the opener. You can still change your card up to {{showtime}}. |

## Fall Tour 2026

Opener is 2026-10-02, Boardwalk Hall. T-10 (Sep 22), T-5 (Sep 27), and T-3 (Sep 29) already emailed everyone on the previous cadence.

T-1 on 2026-10-01 does not email anyone. Push and in-app still go to both groups. The standing email rule (T-5 and T-1, empty card only) starts with the next tour. The Oct 2 lock email is unchanged.

`tourCountdownIncludesEmail` returns false when `days_remaining` is 1 and `first_show_date` is `2026-10-02`.
