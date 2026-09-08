# Resend webhook enablement (open plane)

**Status:** shipped (Slice A / #512)  
**Date:** 2026-09-04  
**Related:** #512 Slice A — persist `email.opened` / `email.clicked`. Slice B (non-opener reminder batch) is **not** in this change.

This is the ops checklist for the Resend dashboard plus the Firestore join plane that Optimize `email_open` reads. No new Cloud Functions secret: signing still uses existing `RESEND_WEBHOOK_SECRET`.

## Endpoint

| Item | Value |
|------|--------|
| Export | `commsResendWebhook` (`functions/index.js`) |
| Method | `POST` only (`405` otherwise) |
| Auth | Svix signature headers (`svix-id`, `svix-timestamp`, `svix-signature`) |
| Secret | `RESEND_WEBHOOK_SECRET` (`whsec_…`) — `firebase functions:secrets:set RESEND_WEBHOOK_SECRET` |
| Docs | [`docs/API.md`](../API.md) §2.5 |

Point the Resend dashboard webhook URL at the deployed Gen2 HTTPS URL for `commsResendWebhook` (region `us-central1`). Do not use a Vercel preview URL.

## Events to enable in the Resend dashboard

In Resend → Webhooks → the `commsResendWebhook` endpoint, enable **all** of:

| Event | Handler | Firestore write |
|-------|---------|-----------------|
| `email.bounced` (Permanent only) | hard-suppress | `email_suppression/{sha256(email)}` |
| `email.complained` | suppress + opt out lifecycle email | `email_suppression` + `users.notificationPrefs` |
| `email.suppressed` | suppress | `email_suppression` |
| `email.opened` | first-open stamp | `comms_email_engagement/{email_id}` `openedAt` |
| `email.clicked` | first-click stamp (also sets `openedAt` if missing) | `comms_email_engagement/{email_id}` `clickedAt` |

Account/domain **open and click tracking** must stay on in Resend, or `email.opened` / `email.clicked` never fire. Temporary bounces are ignored (no suppress).

Re-deliveries of the same event are no-ops (first `openedAt` / `clickedAt` wins). Webhooks are at-least-once and can arrive out of order.

## Send-side tags (join keys)

`commsEmailWorker` stamps Resend `tags` on every `resend.emails.send`:

| Tag | Source |
|-----|--------|
| `uid` | recipient Firebase uid |
| `triggerId` | catalog trigger id |
| `campaignId` | `recipient.vars.campaignId` when present (marketing batches) |

Tag names/values are ASCII letters, numbers, underscores, or dashes only (Resend constraint). The webhook copies those tags onto `comms_email_engagement`. Marketing batches already pass `campaignId` in `vars` (`summer_tour_2026`, `summer_2026_almost_end`).

On a successful email send the orchestrator also merges `resendEmailId` + `campaignId` onto the `fcm_notification_log` dedup doc so Slice B can join delivered → opened without a collection scan.

## Collection

`comms_email_engagement/{resendEmailId}` is Admin-SDK write only. Clients cannot read or write (`firestore.rules`). See [`docs/API.md`](../API.md) §1.14.

## Out of scope (Slice B)

No reminder trigger, reminder template, non-opener audience resolver, or second-wave send. Those stay on #512 until a follow-up PR.
