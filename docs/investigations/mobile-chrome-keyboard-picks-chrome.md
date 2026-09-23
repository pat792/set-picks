# Investigation: Make Picks crushed under keyboard (Chrome mobile)

**Status:** draft investigation — options only; no code ship yet  
**Date:** 2026-09-23  
**Tracking:** GitHub issue **#1041**
**Reporter context:** Chrome on iPhone (Dynamic Island), Make Picks form focused, on-screen keyboard open  
**Related IA:** Picks tertiary (#766), tertiary chrome contract (#765), mobile fixed chrome (#609)  
**Evidence:** reporter screenshot (Cloud Agent artifact `chrome-mobile-keyboard-picks-compressed.jpg`)

---

## Verdict

This is **mostly our chrome stack + iOS fixed-position keyboard behavior**, amplified by **taller Chrome browser chrome**. The tertiary tray (#766) is a real height regression on Make Picks, but it is not the sole cause. The bottom nav sitting **above** the keyboard (instead of being covered) is what finishes the sandwich and leaves ~one field of usable height — so `SongAutocomplete` suggestions have nowhere to open.

---

## What the screenshot shows

Vertical stack when typing a pick:

1. iOS status / Dynamic Island  
2. Chrome address bar (taller “new Chrome” mobile UI)  
3. App brand bar (logo + bell + avatar)  
4. Context bar (“Picks” + show date stepper + Scale)  
5. Tertiary tray (MAKE PICKS / PICKS LAB / SCORECARD)  
6. Tools band (“Picks saved” pill)  
7. **Tiny content strip** — truncated “SET 1 OPENER” + focused input (“Party Time”)  
8. **Primary bottom nav** (Picks / Pools / Standings / Stats / Account) — *above* the keyboard  
9. iOS password/autofill toolbar  
10. Keyboard + system suggestion strip  

“Predictive text not visible” in product terms is almost certainly our **catalog suggestion list** (`SongAutocomplete`), not the iOS suggestion strip (which *is* visible in the shot). The list is `position: absolute` under the field; with the bottom nav immediately under the field there is no room for `max-h-64` suggestions.

---

## Root cause (layered)

### 1) Make Picks mobile chrome is very tall (tertiary regression)

`DashboardLayout` reserves **`15.25rem` (~244px) + safe-area** top padding for the Picks cluster:

```329:336:src/app/layout/DashboardLayout.jsx
          usesMobileFixedChrome
            ? // Picks: tertiary + optional Make Picks tools. Stats Personal/Global:
              // tertiary + up to two quaternary inset trays.
              isPicksCluster
              ? 'pt-[calc(env(safe-area-inset-top,0px)+15.25rem)]'
              : isStatsQuaternary
                ? 'pt-[calc(env(safe-area-inset-top,0px)+17.75rem)]'
                : 'pt-[calc(env(safe-area-inset-top,0px)+11.75rem)]'
```

That budget maps to fixed bands:

| Band | Source | Approx height |
|------|--------|---------------|
| Brand | `DashboardMobileBrandBar` | ~3–3.5rem |
| Context (title + date) | `DashboardMobileContextBar` `min-h-[3.375rem]` | ~3.4rem |
| Tertiary tray | `PicksClusterMobileChrome` via `DashboardMobileChromeBar` `min-h-[3.5rem]` | ~3.5rem |
| Status tools | `PicksMobileFixedChrome` (when “Picks saved” / locked shows) | ~3.5rem |

Pre-#766 Make Picks had brand + context (+ optional tools) without the Lab/Scorecard tray. Adding the tertiary band is a durable **~56px** tax every time the keyboard is open.

### 2) Bottom nav is `position: fixed; bottom: 0` and stays in the typing band

```491:492:src/app/layout/DashboardLayout.jsx
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 w-full border-t ... pb-[env(safe-area-inset-bottom,0px)] ...">
        <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} ... h-16`}>
```

On iOS (Safari **and** Chrome — both WebKit), focusing an input typically **offsets the layout viewport** so the focused control stays visible. Fixed `bottom: 0` chrome rides that offset and ends up **visually above the keyboard** instead of staying covered behind it. That is browser behavior, not a Tailwind bug — but we opted into the worst case by always showing primary nav during text entry.

There is **no** existing `visualViewport` / keyboard-open hook in the dashboard shell today.

### 3) Shell is a locked `100dvh` frame

```208:208:src/app/layout/DashboardLayout.jsx
    <div className="flex h-[100dvh] min-h-0 w-full ... overflow-hidden md:h-screen">
```

The scrollport is only `<main>`. Fixed header + fixed footer + shrunk visual viewport leave almost no flex space for the focused field and zero spare room for an absolute dropdown.

### 4) Autocomplete cannot escape the squeeze

```209:213:src/shared/ui/SongAutocomplete.jsx
      {isOpen && filteredSongs.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto ..."
        >
```

Same `z-50` as bottom nav; opens downward only; not portaled. Under keyboard + bottom nav this list is clipped / covered.

### 5) Chrome mobile UI shrinks the visual budget further

Reporter’s “new Google Chrome format” matches a taller address bar / browser chrome on iOS Chrome vs older builds or Safari. That is environmental, not something we control — but it lowers the threshold where our fixed stack becomes unusable.

### Viewport meta note (Android vs iOS)

`app.html` / `index.html` use:

`width=device-width, initial-scale=1.0, viewport-fit=cover`

No `interactive-widget=…`. On **Chrome Android**, default since 108 is roughly `resizes-visual` (layout viewport does not shrink; fixed bottom tends to stay under the keyboard). On **iOS Chrome/Safari**, `interactive-widget` is **not implemented** (WebKit). A meta-only fix will not solve the iPhone screenshot; it may still be useful as a defensive Android opt-in later.

---

## Rough height math (why it feels broken)

Illustrative iPhone ~852 CSS px tall:

- Browser chrome + keyboard + system bars: often **~45–55%** of the screen when typing  
- Our fixed app chrome (top 15.25rem + bottom `h-16`): **~308px** before safe-area  
- Remainder for the pick field + suggestions: often **&lt; 100px** → matches the letterboxed input in the screenshot

Tertiary alone did not invent the bug; it removed the last margin of safety.

---

## Options (recommended order)

### Option A — Hide primary bottom nav while keyboard is open (fast, high leverage)

**Idea:** Detect keyboard via `window.visualViewport` (height drop vs `window.innerHeight` / baseline `svh`, ignore pinch-zoom). When open, `translate-y-full` / `invisible` / `pointer-events-none` the mobile bottom `<nav>`, and shrink `<main>` bottom padding.

**Pros:** Reclaims ~64px + safe-area immediately on every dashboard form; small, localized change in `DashboardLayout`.  
**Cons:** Needs careful threshold so collapsing URL bars do not flicker; must restore on blur.  
**Risk:** Low–medium.  
**Platforms:** Helps iOS (the reported case) and any Android build that lifts fixed footers.

### Option B — Picks “entry focus mode” (best UX for this screen)

**Idea:** While any Make Picks `SongAutocomplete` is focused:

- Hide bottom nav (A)  
- Collapse or hide tertiary tray + “Picks saved” tools band  
- Optionally keep only brand or a slim “Done” / show label strip  
- Ensure the active field scrolls into the visual viewport  

**Pros:** Makes typing the primary job; largest readability win for catalog search.  
**Cons:** More product design; must not break lock/status discovery after blur.  
**Risk:** Medium. Natural owner: `features/picks` + layout shell hook.  
**Fits FSD:** focus orchestration in `features/picks/model`; layout reacts to a small shared “keyboard chrome” signal or picks-only callback.

### Option C — Portal / flip autocomplete (fixes “predictive text” even if chrome stays)

**Idea:** Render the suggestion list in a portal; position from `getBoundingClientRect()`; if space below &lt; N px, open **upward**; cap height to `visualViewport` remainder.

**Pros:** Directly addresses missing catalog suggestions; reusable for admin setlist builder.  
**Cons:** Alone does **not** fix the crushed field; still need A or B for readability.  
**Risk:** Medium (focus/blur, scroll, orientation).  

### Option D — CSS / viewport meta only (insufficient for iOS)

| Lever | Effect |
|-------|--------|
| `interactive-widget=overlays-content` | Android opt-in; keyboard overlays; iOS ignore |
| `interactive-widget=resizes-content` | Android layout shrinks with keyboard — can make fixed footers *worse* for us |
| Shell `100svh` instead of `100dvh` | Stabilizes frame vs dynamic UI chrome; does not hide bottom nav on iOS offset |
| `env(keyboard-inset-*)` / VirtualKeyboard API | Chromium desktop/Android niche; not an iOS fix |

**Recommendation:** Do **not** ship D alone. Optionally document Android meta choice as a follow-up after A/B.

### Option E — Permanent chrome declutter on Make Picks (IA tweak)

**Idea:** Reduce always-on height without waiting for keyboard:

- Move “Picks saved” out of a full `DashboardMobileChromeBar` into a quieter in-flow or overlay chip  
- Or collapse Lab/Scorecard into a overflow menu while on Make Picks (controversial vs #766 IA)  
- Tighten `min-h` / padding on brand + context + tertiary  

**Pros:** Helps even before focus.  
**Cons:** Touches dashboard IA contract (`docs/DASHBOARD_IA.md`); tertiary contract prefers equal trays. Prefer temporary collapse (B) over permanently deleting tertiary.

---

## Recommended plan

1. **Ship A + C together** as the first fix PR (keyboard-aware bottom nav + portaled/flipping suggestions). Validates on iOS Chrome/Safari and Android Chrome.  
2. **Follow with B** if A+C still feel cramped with tertiary + status bands visible (likely on small phones).  
3. Keep **E** as optional polish after measuring post-A/C.  
4. Skip relying on **D** for the iPhone report; re-evaluate Android only if QA shows a divergent footer behavior.

### Suggested acceptance checks

- iPhone Chrome + Safari: focus Set 1 Opener → field and **at least 3 suggestion rows** visible; bottom nav not covering suggestions.  
- Android Chrome: same; confirm footer does not jump awkwardly when keyboard closes.  
- Blur / navigate away: bottom nav and tertiary restore; no stuck `translate` or padding.  
- Make Picks only (Lab / Scorecard / other tabs): no unintended chrome hide unless using global Option A.  
- Landscape / Dynamic Island / home-indicator safe-area: no double padding.

### Implementation sketch (not committed)

- `shared/hooks/useVirtualKeyboardOpen.js` — visualViewport listener → boolean + optional `keyboardInsetPx` CSS var on `documentElement`.  
- `DashboardLayout` — apply `data-keyboard-open` to hide mobile bottom nav + adjust `main` `pb-*`.  
- `SongAutocomplete` — portal listbox; flip when `spaceBelow < minMenu`.  
- Optional picks focus mode: `features/picks/model` sets `data-picks-entry-focus` to collapse portal chrome roots.

---

## Out of scope / non-goals

- Redesigning desktop sticky chrome  
- Changing Picks tertiary routes or labels  
- Relying on WebKit to implement `interactive-widget`  

---

## Decision needed

Product/engineering pick among **A+C (recommended first PR)**, **A+B+C (max comfort)**, or **E-first IA change**. This document is the options brief; implementation should land in a separate `feat/<issue#>-…` PR against `staging` with PATCH/MINOR SemVer once behavior ships.
