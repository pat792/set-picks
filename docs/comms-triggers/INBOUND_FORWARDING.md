# Inbound mail: setlistpickem.com → road2media Workspace

**Status:** implemented (code) — webhook + secret live; waiting on function deploy  
**Date:** 2026-09-22  
**Version:** v1.75.0  
**Related:** #1037 (this work), #442 (outbound Resend), #498 (sender badge — not inbound), #770 / `docs/DASHBOARD_IA.md` (Contact us hidden until an inbound address exists)

Apex receiving is a catch-all: mail to any `@setlistpickem.com` local-part arrives at Resend. We forward an allowlist only.

## Allowlist

| Address | Destination | Notes |
|---------|-------------|-------|
| `updates@setlistpickem.com` | `support@road2media.com` | Reply target (From on every Resend send) |
| `unsubscribe@setlistpickem.com` | same mailbox | mailto clients that ignore one-click. Label it in Gmail so it does not sit in the support queue |
| `help@setlistpickem.com` | **not forwarded** | Only after something public uses that address |

Everything else returns HTTP 200 with no forward so Resend does not retry spam to random local-parts.

Destination matches Privacy and Terms: `support@road2media.com`. One licensed road2 user. No new seat.

## Code

| Item | Value |
|------|--------|
| Export | `commsResendInboundWebhook` (`functions/index.js`) |
| Method | `POST` only (`405` otherwise) |
| Auth | Svix (`svix-id`, `svix-timestamp`, `svix-signature`) — same helper as `commsResendWebhook` |
| Secret | `RESEND_INBOUND_WEBHOOK_SECRET` (own `whsec_`; Resend issues one per webhook URL) |
| API | `RESEND_API_KEY` + `resend.emails.receiving.forward` (SDK `^6.28.1`) |
| Envelope `from` | `updates@setlistpickem.com` — Resend send-as, not a rewrite of the fan’s From |
| Passthrough | default (omit `passthrough: false`) so body, attachments, and original sender are preserved |
| Idempotency | `inbound-fwd:{svix-id}` so webhook retries do not double-forward |

```js
await resend.emails.receiving.forward({
  emailId: event.data.email_id,
  to: "support@road2media.com",
  from: "updates@setlistpickem.com",
});
```

Do **not** subscribe `email.received` on `commsResendWebhook`. That handler returns `ignored_event_type` and never forwards.

## Remaining ops (before the first real reply lands)

Resend webhook **`9871d42f-55dd-4419-973e-02ced0c2b02e`** is enabled with **only** `email.received`, pointed at `https://us-central1-set-picks.cloudfunctions.net/commsResendInboundWebhook`. `RESEND_INBOUND_WEBHOOK_SECRET` is version 1 in Secret Manager. The engagement webhook is unchanged.

1. Deploy `commsResendInboundWebhook` so that URL stops 404ing (`npm run comms:deploy -- --confirm --group infra` after merge, or `firebase deploy --only functions:commsResendInboundWebhook`). The secret already exists; the first revision will bind it.
2. Gmail filter: `to:unsubscribe@setlistpickem.com` → label, skip inbox (or archive).
3. Send from an outside account to `updates@setlistpickem.com`. Confirm it appears in the road2 inbox and that Reply addresses the outside sender.
4. Reply to a real triggered mail (or one-uid canary). Same check.
5. Mail a random local-part (`not-a-mailbox@setlistpickem.com`). Confirm it does **not** land in Workspace.

`send.setlistpickem.com` MX (bounce return-path) stays untouched.

## After it works

Only then consider showing Contact us on Preferences (`docs/DASHBOARD_IA.md` currently hides it because there is no inbound address) and adding `help@` to the allowlist.

Firebase Auth stays on `noreply@set-picks.firebaseapp.com`. After forwarding works, set that template’s Reply-to (Console → Authentication → Templates) to `updates@setlistpickem.com`. See `docs/FIREBASE_AUTH_EMAIL_TEMPLATES.md`.

Replying from Gmail still sends as `support@road2media.com` unless Send-as `updates@` via Resend SMTP is configured. Optional; not required for inbound.

## What not to do

| Approach | Why it loses |
|----------|----------------|
| New Google Workspace for setlistpickem.com | Apex MX would have to move to `smtp.google.com`, replacing Resend receiving. Extra subscription. |
| Cloudflare Email Routing | Same MX replacement (`route.cloudflare.net`). |
| `Reply-To: support@road2media.com` only | Fan sees road2media; mail typed to `updates@` still never arrives without this webhook. |
| Catch-all forward | Apex receiving already accepts every local-part. Forwarding all of it fills Workspace with spam. |
| `email.received` on the engagement webhook | Ignore path. No forward. |

## Test plan

- [x] `emails.receiving.forward` exists on the installed `resend` SDK (`^6.28.1`)
- [x] Unit: allowlist forward, drop random local-part, ignore `help@`, engagement webhook still ignores `email.received`
- [x] Resend webhook + inbound signing secret
- [ ] Deploy `commsResendInboundWebhook`
- [ ] Mail to `updates@` arrives at the Workspace mailbox
- [ ] Mail to a random local-part does not
- [ ] Mailto to `unsubscribe@` arrives labeled, and one-click unsubscribe still opts out without that mailbox
- [ ] Reply from Workspace reaches the original sender
- [ ] `send.setlistpickem.com` MX is unchanged; a canary send still authenticates
