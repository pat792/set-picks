# Outbound auth handoff inventory (#830 / #832)

After marketing pages boot without Firebase, auth CTAs and deep links must land on the **app** entry (`/login`, `/join`, `/invite`, `/dashboard`, `/setup`) — never put Firebase back on marketing HTML to support legacy query params.

## Classification

| Surface | Class | Target |
|---------|-------|--------|
| Splash Sign in / Create account | `retarget-auth` | `/login?mode=signin` / `/login?mode=signup` |
| Legacy `/?login=true` | `retarget-auth` | Redirects to `/login?mode=signin` (marketing + app splash) |
| Password reset complete CTA | `retarget-auth` | `/login?mode=signin` |
| QA runners (`qa:cache`, auth scenarios, Google signup) | `retarget-auth` | `/login?mode=signin` |
| Email CTAs to `/dashboard/*`, `/setup` | `app-ok` | Unchanged — app boot shell (#773) |
| `/join/:code`, `/invite/:handle` | `invite-shell` | App shell via `api/invite` → `spa-boot` / `app.html` |
| Marketing nav (how-it-works, tour-stats, …) | `public-static` | Marketing entry |
| Soft inbox CTAs (same-origin) | `app-ok` | React Router soft-nav inside app |

## Done in 1.47.0

- Marketing CTAs → `/login`
- Password reset link → `/login?mode=signin`
- QA auth helpers retargeted
- Invite OG/browser template uses app shell (not marketing `index.html`)

## Follow-ups (if any legacy links appear in the wild)

- Comms email templates: no `/?login=true` found under `emails/` / `comms/` at ship time; prefer `/login` or `/dashboard` going forward.
- Push payloads: keep deep-linking to `/dashboard/*` (app entry).
- Do **not** re-enable splash modals on the marketing document for legacy query params.
