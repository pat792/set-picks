# Inbound mail: setlistpickem.com → road2media Workspace

**Status:** live — inbound wrap + Workspace Send-as via Resend SMTP confirmed 2026-09-22 (receive, reply To, branded From)
**Date:** 2026-09-22  
**Version:** v1.75.0  
**Related:** #1039 (closeout), #1037 (original webhook), #442 (outbound Resend), #498 (sender badge — not inbound), #770 / `docs/DASHBOARD_IA.md` (Contact us → `support@setlistpickem.com`)

Apex receiving is a catch-all: mail to any `@setlistpickem.com` local-part arrives at Resend. We forward an allowlist only.

## Allowlist

| Address | Destination | Notes |
|---------|-------------|-------|
| `updates@setlistpickem.com` | `support@road2media.com` | Reply target (From on every Resend send) |
| `unsubscribe@setlistpickem.com` | auto-suppress; forward only if the body looks like a human | RFC 8058 mailto fallback. Empty / “unsubscribe” → `email_suppression` (`mailto_unsubscribe`) + prefs opt-out, no inbox. Prose still opts out and forwards. |
| `support@setlistpickem.com` | same mailbox | Public contact — Preferences, Privacy, Terms, marketing footer |
| `help@setlistpickem.com` | **not forwarded** | Do not publish. Public contact is `support@` |

Everything else returns HTTP 200 with no forward so Resend does not retry spam to random local-parts.

Public address is `support@setlistpickem.com`. Workspace destination stays `support@road2media.com` (Privacy/Terms used to publish that mailbox). One licensed road2 user. No new seat.

## Code

| Item | Value |
|------|--------|
| Export | `commsResendInboundWebhook` (`functions/index.js`) |
| Method | `POST` only (`405` otherwise) |
| Auth | Svix (`svix-id`, `svix-timestamp`, `svix-signature`) — same helper as `commsResendWebhook` |
| Secret | `RESEND_INBOUND_WEBHOOK_SECRET` (own `whsec_`; Resend issues one per webhook URL) |
| API | `RESEND_API_KEY` + `receiving.get` then `emails.send` (SDK `^6.28.1`) |
| Envelope `from` | Verified domain only. Display name is `{original sender} via Setlist Pick'em <support@…>` so Gmail’s sender column is not just the mailbox. |
| Reply-To | Original `From` so Workspace **Reply** goes to the fan. |
| Body wrap | `---------- Forwarded message ----------` plus From / To / Subject, then the original html/text. |
| Attachments | If the inbound had files, the raw `.eml` is attached as `forwarded_message.eml`. |
| Idempotency | `inbound-fwd:{svix-id}` so webhook retries do not double-forward |

`receiving.forward` passthrough cannot do this. It recopies the original body as a **new** send from `support@` / `updates@` and drops the fan’s From. That is why the first canary looked like it came from setlistpickem with no sender.

```js
await resend.emails.send({
  from: "Jane Doe via Setlist Pick'em <support@setlistpickem.com>",
  to: "support@road2media.com",
  replyTo: "jane@example.com",
  subject: "Fwd: Need help with picks",
  text, // wrap header + original text
  html, // wrap header + original html
});
```

Do **not** subscribe `email.received` on `commsResendWebhook`. That handler returns `ignored_event_type` and never forwards.

## Remaining ops

Function URL `https://us-central1-set-picks.cloudfunctions.net/commsResendInboundWebhook` is live (revision `commsresendinboundwebhook-00001-vud`). Resend webhook **`9871d42f-55dd-4419-973e-02ced0c2b02e`** is `email.received` only. `RESEND_INBOUND_WEBHOOK_SECRET` v1 is bound.

1. Optional: mail a random local-part and confirm it does **not** land.
2. Firebase Auth Reply-to is set on Password reset / Email verification / Email change → `updates@setlistpickem.com`. Leave Auth SMTP on Google.

`send.setlistpickem.com` MX (bounce return-path) stays untouched.

## After it works

Contact us is live on Preferences, Privacy, Terms, and the marketing legal footer. Do not add `help@` unless we publish that local-part. Owned-social contact button (when used) should be `support@setlistpickem.com`, not `social@` or `updates@`.

Firebase Auth stays on `noreply@set-picks.firebaseapp.com`. Reply-to on those templates is `updates@setlistpickem.com` (Console, 2026-09-22). Do not point Auth SMTP at Resend. See `docs/FIREBASE_AUTH_EMAIL_TEMPLATES.md`.

## Send-as from Workspace

**Live 2026-09-22** on `pat@road2media.com` (`support@` is a Workspace alias of that user). Gmail Send-as → `support@setlistpickem.com` through Resend SMTP. Do **not** add `setlistpickem.com` as a Workspace domain or domain alias — that would move apex MX off Resend receiving.

The Gmail add-address popup often dumps to `#inbox` after “checking credentials.” Use an **Incognito** window. After confirm, **From** is inside the compose **To** box — click To to expand it.

Public replies should send as `support@setlistpickem.com`. Add `updates@` only if you also answer product/lifecycle mail from this mailbox.

1. Resend API key **`gmail-send-as`** is already created (`ae44f43f-c673-49cf-b6bf-540ca211ec54`, `sending_access`, domain `setlistpickem.com`). Token is shown once at create — paste it into Gmail; do not put it in the repo or reuse Cloud Functions `RESEND_API_KEY`.
2. In Gmail (`support@road2media.com`) → **Settings → See all settings → Accounts** → **Send mail as** → **Add another email address**.
3. Name: `Setlist Pick'em`. Address: `support@setlistpickem.com`.
4. Uncheck **Treat as an alias**. Choose **Send through smtp.resend.com**:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL)
   - Username: `resend`
   - Password: the new API key
5. Gmail sends a verification message to `support@setlistpickem.com`. The inbound webhook forwards it here — open it and confirm.
6. Compose → **From** → pick `support@setlistpickem.com`. To make it the default on this mailbox only: **Send mail as** → **make default**. Leave the default as `support@road2media.com` if this inbox also handles other road2 mail.

If Gmail offers “send through Google” / treat as alias, skip it. Google is not in `setlistpickem.com` SPF, so those messages fail DMARC.

If Next Step says **Functionality not enabled** / “You must send through setlistpickem.com SMTP servers… not available for your account”, the road2media Workspace has per-user outbound gateways off (default). As Super Admin:

1. [admin.google.com](https://admin.google.com) → **Apps → Google Workspace → Gmail → End User Access** (direct: [End User Access](https://admin.google.com/ac/apps/gmail/enduseraccess))
2. **Allow per-user outbound gateways** → check **Allow users to send mail through an external SMTP server when configuring a "from" address hosted outside your email domains**
3. Save. Wait a few minutes (up to an hour), then retry Send-as with Treat as alias unchecked.

Do **not** add an org-wide Gmail **Outbound gateway** pointed at `smtp.resend.com` — that would send all road2 mail through Resend. No new user or `setlistpickem.com` Workspace domain.

## What not to do

| Approach | Why it loses |
|----------|----------------|
| New Google Workspace for setlistpickem.com | Apex MX would have to move to `smtp.google.com`, replacing Resend receiving. Extra subscription. |
| Cloudflare Email Routing | Same MX replacement (`route.cloudflare.net`). |
| `Reply-To: support@road2media.com` only | Fan sees road2media; mail typed to `updates@` still never arrives without this webhook. |
| Catch-all forward | Apex receiving already accepts every local-part. Forwarding all of it fills Workspace with spam. |
| `email.received` on the engagement webhook | Ignore path. No forward. |

## Test plan

- [x] `emails.receiving.get` + `emails.send` exist on the installed `resend` SDK (`^6.28.1`)
- [x] Unit: wrap From + Reply-To, drop random local-part, ignore `help@`, engagement webhook still ignores `email.received`
- [x] Resend webhook + inbound signing secret
- [x] Deploy `commsResendInboundWebhook`
- [x] Mail to `updates@` arrives at the Workspace mailbox (2026-09-22 23:46Z, inbound `24f03e75-…` → forward `01a0cb83-…`)
- [ ] Mail to a random local-part does not
- [x] Mailto to `unsubscribe@` auto-suppresses (empty/one-word, no inbox); prose still forwards after opt-out
- [x] Reply from Workspace as `support@setlistpickem.com` (Incognito Send-as + Resend SMTP; From is inside the To box)
- [ ] `send.setlistpickem.com` MX is unchanged; a canary send still authenticates
