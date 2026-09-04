# #968 Editorial viewport tokens

**Status:** Draft (implementing)  
**Date:** 2026-09-02  
**Issue:** #968  
**Extends:** #944 chrome split (editorial light / product dark)  
**Related:** #942 content IA

Use these tokens on the next marketing PR. Do not invent a new `px-4 sm:px-6 lg:px-8` or magic `5.35rem` header on editorial / splash chrome.

---

## Tokens (local)

Source: `src/shared/ui/marketingEditorialViewport.css`  
Class constants: `src/shared/ui/marketingEditorialChrome.js`

| Token | CSS variable | Class / constant | Value |
|-------|--------------|------------------|-------|
| Page gutter | `--page-gutter` | `marketing-page-gutter-x` / `MARKETING_PAGE_GUTTER_X` | 1rem / sm 1.5rem / lg 2rem |
| Header height | `--header-height` | `marketing-header-height` / `MARKETING_HEADER_HEIGHT` | 5.35rem / sm 5.25rem (same rem as `splashScrollPadding.js`) |
| H1 | `--editorial-text-h1` | `editorial-type-h1` | clamp 1.875rem → 3rem |
| Lede | `--editorial-text-lede` | `editorial-type-lede` | clamp 1.125rem → 1.25rem |
| Body | `--editorial-text-body` | `editorial-type-body` | 1.125rem (sentence copy) |
| Meta | `--editorial-text-meta` | `editorial-type-meta` | 0.875rem |
| Eyebrow | `--editorial-text-eyebrow` | `editorial-type-eyebrow` | 0.75rem (not 10px) |

Fonts stay **Space Grotesk** display + **Inter** body. Do not import road2media globals.

### Sibling cards

`MARKETING_EDITORIAL_CARD_TRACK` + `MARKETING_EDITORIAL_CARD` share height per row. Pin actions with `MARKETING_EDITORIAL_CARD_ACTION` (`mt-auto`). Do not pad shorter copy to match a taller sibling.

---

## Light editorial surfaces

`/how-it-works`, `/about`, `/phish-setlist-prediction-game`, `/how-scoring-works`

---

## Non-goals (do not reopen)

- Splash hero viewport math (#837) — keep `min-h-[100svh]`; no road2 `PageStage`
- Dashboard / post-login type (#609) — `text-body` 0.875rem stays
- Tour stats stays dark product chrome (#944)
- Shared npm package with road2media
- Marketing hamburger / light header (#706)
