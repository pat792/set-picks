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
3. **Logo asset** — simple square SVG (BIMI spec limits complexity; a dedicated asset — the old 854 KB embedded-raster `favicon.svg` was removed in #662).
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
