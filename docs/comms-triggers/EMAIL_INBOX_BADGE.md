# Email inbox sender badge (BIMI / domain favicon)

**Issue:** [#498](https://github.com/pat792/set-picks/issues/498)

## Two different logos (do not conflate)

| Layer | What you see | Controlled by | Asset |
|-------|--------------|---------------|-------|
| **In-body header** | Large vinyl mark when the email is **open** | HTML `<img>` in `MarketingLayout` / `buildBrandedEmailHtml` | `comms/emailBranding.cjs` → `/favicon/web-app-manifest-512x512.png` |
| **Inbox sender badge** | Small circle beside **Setlist Pick'em** in the **inbox list** | BIMI + DMARC (Gmail), domain favicon fallback — **not** the email template | DNS / certificates (#498 ops) |

**Typical symptom (see QA screenshot):** opened email shows the vinyl logo correctly; inbox list shows a **generic blue person icon**. That means in-body branding works and only the **inbox badge** layer is missing.

Changing the in-body `<img>` URL will **not** fix the inbox circle. Gmail does not use the HTML header image for the list avatar.

---

## In-body logo (working — keep separate)

- Shared helper: `comms/emailBranding.cjs` → `buildEmailInBodyLogoUrl()`
- Marketing: `emails/src/components/MarketingLayout.jsx`
- Service comms: `functions/commsEmailWorker.js` → `buildBrandedEmailHtml()`
- Display size in template: 48×48 CSS pixels; source is the 512×512 vinyl PNG

---

## Inbox badge — what actually fixes the blue circle

### Primary: BIMI (Gmail, Yahoo)

Gmail shows a verified brand mark in the inbox list only when **BIMI** is fully configured:

1. **DMARC** on `setlistpickem.com` at `p=quarantine` or `p=reject`, with SPF/DKIM alignment for `updates@setlistpickem.com` (Resend verified domain).
2. **BIMI DNS** — publish `default._bimi.setlistpickem.com` TXT referencing an **SVG** logo URL + **VMC** (Verified Mark Certificate from an approved CA).
3. **Logo asset** — simple square SVG (BIMI spec limits complexity; not the 854 KB `favicon.svg`).
4. **Enrollment** — register with mailbox providers; propagation can take days.

This is **DNS + certificate ops**, not an app deploy. Track on #498.

### Partial fallback: domain favicon

Some clients (not reliably Gmail) fetch `https://<from-domain>/favicon.ico` when BIMI is absent.

| Check | URL |
|-------|-----|
| www (Vercel rewrite) | `https://www.setlistpickem.com/favicon.ico` → `/favicon/favicon.ico` |
| Nested ICO | `https://www.setlistpickem.com/favicon/favicon.ico` |
| Apex | `https://setlistpickem.com/favicon.ico` — confirm apex DNS/hosting matches `From` domain |

Candidate badge asset for BIMI prep: `EMAIL_INBOX_BADGE_FAVICON_PATH` in `comms/emailBranding.cjs` (`/favicon/favicon-96x96.png`).

---

## DNS audit results — 2026-08-03 (#498)

Live `dig`/`curl` audit against public DNS. Everything below is **DNS/registrar ops**, not an app deploy.

| Record | Found | Verdict |
|--------|-------|---------|
| SPF (apex TXT) | `v=spf1 include:_spf.firebasemail.com ~all` | Firebase only — fine; Resend mail authenticates via the `send.` return-path, not the apex |
| MX `send.setlistpickem.com` | `10 feedback-smtp.us-east-1.amazonses.com` | Resend return-path MX present ✅ |
| **TXT `send.setlistpickem.com`** | **— none —** | ❌ **Missing the SPF half of Resend's record pair.** SPF on the Return-Path domain fails/none; DMARC currently passes on **DKIM alignment alone** |
| DKIM `resend._domainkey` | RSA key published (1024-bit) | ✅ signs `d=setlistpickem.com`, relaxed alignment satisfies DMARC |
| DMARC `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | ✅ `p=quarantine` meets the BIMI prerequisite. ⚠️ `rua` points at the registrar's default aggregator — reports are not monitored by us |
| BIMI `default._bimi` | — none — | Expected; not yet configured |
| Favicon apex | `https://setlistpickem.com/favicon.ico` → 301 → www → `200 image/vnd.microsoft.icon` | ✅ apex + www both resolve (nightly `favicon-prod` CI job guards this, #662) |

### Human actions required (in priority order)

1. **Add the missing SPF TXT on the send subdomain** — in the DNS zone add
   `send.setlistpickem.com TXT "v=spf1 include:amazonses.com ~all"`
   (confirm the exact value in the Resend dashboard → Domains → setlistpickem.com; the MX half of the pair is already live). Zero-cost deliverability + alignment fix; do this regardless of the BIMI decision.
2. **BIMI logo decision (business call, not just ops):**
   - **VMC** (Verified Mark Certificate, DigiCert/Entrust, ≈ $1,000–1,500/yr) requires a **registered trademark** of the logo — full Gmail + Yahoo badge with blue verified check.
   - **Gmail CMC** (Common Mark Certificate) drops the trademark requirement if the mark has 12+ months of verifiable prior use — cheaper path, Gmail badge without the check mark.
   - Until a certificate exists, publishing `default._bimi` TXT alone does nothing in Gmail.
3. **Prepare the BIMI SVG** once (2) is decided — SVG Tiny PS profile, square, solid background; the vinyl mark needs conversion (the old 854 KB `favicon.svg` was removed in #662 and was never BIMI-suitable). Repo work, can ship ahead of the cert.
4. **Zero-cost partial fallback (optional):** give `updates@setlistpickem.com` a Google account with the brand mark as its profile photo — Gmail shows the sender's Google profile avatar for that address without BIMI. Covers Gmail only.
5. **Repoint DMARC `rua`** to a monitored mailbox or DMARC-report service so alignment regressions (like finding 1) surface.

---

## DNS audit commands (human)

```bash
# DMARC (required before BIMI)
dig +short TXT _dmarc.setlistpickem.com

# SPF on sending domain
dig +short TXT setlistpickem.com | grep spf

# BIMI (after VMC obtained)
dig +short TXT default._bimi.setlistpickem.com

# Favicon reachability
curl -sI https://www.setlistpickem.com/favicon.ico | head -5
curl -sI https://setlistpickem.com/favicon.ico | head -5
```

Resend dashboard: confirm `setlistpickem.com` verified, DKIM active, `updates@setlistpickem.com` sender identity matches DMARC alignment.

---

## QA checklist

- [ ] **Opened email** — large vinyl logo in header (regression guard)
- [ ] **Gmail inbox list** — brand icon instead of blue person circle (#498 AC)
- [ ] Gmail web + iOS
- [ ] Apple Mail inbox list
- [ ] Service comms from `updates@setlistpickem.com` — same badge

---

## Related

- #456 branded HTML shell (in-body — working)
- #497 closed as duplicate (mis-scoped in-body bug)
- `vercel.json` `/favicon.ico` rewrite (domain favicon fallback only)
