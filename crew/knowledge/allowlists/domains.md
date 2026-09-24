# Scrape / research allowlist (L1+)
#
# Add hosts via PR. Market Intelligence Operator must refuse hosts not listed.
# Respect robots.txt and site ToS. No paywall bypass, no PII harvest.
#
# Format: one hostname per line (no scheme). Lines starting with # are comments.
#
# Scope for competitor hosts (#933): a single document GET of the public
# homepage for title / meta description / H1 / H2 / H3 keyword patterns only.
# Never rip full-night setlists, article bodies, or paywalled threads.
#
# -----------------------------------------------------------------------------
# Explicit refuse (code + this file — do not add these)
# -----------------------------------------------------------------------------
# - Google / Bing / other SERP HTML (no search-results scraping).
# - Paywalled forums and login-gated boards.
# - PII surfaces: /profile, /account, /users/, /messages, /admin, /onboarding.
# - Aggressive crawl rates (scanner enforces a delay + max URL cap).
# - callingit.live — ToS (2026-09-03 /legal): “not scrape the data”. OMIT.
# - ihoz.com / www.ihoz.com — HTTPS presents a self-signed cert; HTTP
#   robots.txt is 404. Robots/ToS cannot be verified. OMIT.
# - phantasytour.com / www.phantasytour.com — robots.txt allows `/`, but
#   /terms-of-use returned a browser-upgrade interstitial with no readable
#   ToS text (2026-09-03). Unclear legal/ToS → OMIT.
# - phish.net — not in the 2026-08 plan competitor-title set for this child;
#   archive encyclopedia we already concede. Do not add without a ToS re-review.
# -----------------------------------------------------------------------------

# First-party + existing research hosts
www.setlistpickem.com
setlistpickem.com
github.com
www.github.com
developers.google.com
support.google.com

# SEO title/H1 peers (#933) — homepage GET only; robots Allow: /
# phishpicks.net 308s to phish.jampicks.com (canonical Host in robots.txt).
# ToS (https://phish.jampicks.com/terms, 2026-09-03): fan hobby game; no
# scrape prohibition. robots Disallow: /api/ /admin /picks /profile
# /messages /onboarding — scanner must not fetch those paths.
phishpicks.net
www.phishpicks.net
phish.jampicks.com
