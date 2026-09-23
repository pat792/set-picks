# Investigation: Make Picks crushed under keyboard (Chrome mobile)

**Status:** draft investigation — options only; no code ship yet  
**Date:** 2026-09-23 (updated same day with Safari contrast)  
**Tracking:** GitHub issue **#1041**  
**Reporter context:** Same Make Picks flow on iPhone — **Chrome** (broken) vs **Safari** (usable)  
**Related IA:** Picks tertiary (#766), tertiary chrome contract (#765), mobile fixed chrome (#609)  

### Evidence (in-repo)

| Browser | Result | File |
|---------|--------|------|
| **Chrome iOS** | Letterboxed field; bottom nav above keyboard; catalog suggestions not usable | [`evidence/chrome-ios-keyboard-crushed.jpg`](evidence/chrome-ios-keyboard-crushed.jpg) |
| **Safari iOS** | Field + ≥4 suggestion rows readable; app bottom nav not in the typing band; easier to navigate | [`evidence/safari-ios-keyboard-usable.jpg`](evidence/safari-ios-keyboard-usable.jpg) |

---

## Verdict

**Chrome iOS is the failure mode; Safari iOS on the same device/app remains navigable.** Same Make Picks form, same tertiary chrome, same `SongAutocomplete` — so this is not “tertiary alone always breaks picking.” It is **Chrome’s keyboard + browser-chrome interaction with our fixed shell** (tall top stack + `position: fixed` bottom nav) that sandwiches the field.

Tertiary height (#766) still matters as a **Chrome aggravator**: it removes margin when Chrome keeps our chrome in the visual viewport. Safari’s keyboard presentation effectively gives the focused field + suggestion list the usable band, so the same chrome budget is tolerable there.

---

## Side-by-side: Chrome vs Safari (reporter evidence)

### Chrome iOS — crushed

![Chrome iOS: keyboard open, bottom nav above keyboard, single crushed pick field](evidence/chrome-ios-keyboard-crushed.jpg)

Vertical stack when typing a pick:

1. iOS status / Dynamic Island  
2. **Chrome address bar** (taller “new Chrome” mobile UI — stays in play)  
3. App brand bar (logo + bell + avatar)  
4. Context bar (“Picks” + show date stepper + Scale)  
5. Tertiary tray (MAKE PICKS / PICKS LAB / SCORECARD)  
6. Tools band (“Picks saved” pill)  
7. **Tiny content strip** — truncated label + focused input  
8. **Primary bottom nav** (Picks / Pools / Standings / Stats / Account) — *above* the keyboard  
9. iOS password/autofill toolbar  
10. Keyboard + system suggestion strip  

Catalog autocomplete has nowhere to open under the field.

### Safari iOS — usable (contrast)

![Safari iOS: keyboard open, Set 1 Opener + four catalog suggestions visible](evidence/safari-ios-keyboard-usable.jpg)

Observed when typing `Und` on Set 1 Opener:

1. iOS status / Dynamic Island only at the top (no app brand/tertiary stack dominating the typing band)  
2. Focused **SET 1 OPENER** field with room around it  
3. **Four catalog suggestion rows** visible (e.g. Bouncing Around the Room, Undermind, Destiny Unbound, Scents and Subtle Sounds) with Odds / Total / Gap / Last  
4. More form content (e.g. ENCORE) still peeking in the scrollport above the browser chrome  
5. Safari floating URL pill + form accessory (prev/next/done) stacked above the keyboard — **not** our primary bottom nav  
6. iOS predictive strip (`Und` / Under / Understand) fully visible  

**Navigation difference:** In Safari the picks form stays the job of the visual viewport; browser chrome hugs the keyboard. In Chrome our **primary bottom nav reappears above the keyboard** and the fixed top stack remains, so the form is letterboxed and harder to scan/select.

### Comparison table

| Dimension | Chrome iOS | Safari iOS |
|-----------|------------|------------|
| Focused pick field | Severely compressed | Comfortable, full control chrome |
| `SongAutocomplete` list | Not usable / no room | ≥4 rows readable |
| App bottom nav while typing | Visible **above** keyboard | Not occupying the typing band |
| App top chrome (brand / tertiary / status) | Stays stacked in view | Not dominating the typing band |
| Browser chrome | Tall Chrome address bar + autofill bar | Compact Safari URL pill + accessory |
| Overall navigate-while-typing | Poor | Acceptable / easy |

---

## Root cause (layered)

### 1) Make Picks mobile chrome is very tall (tertiary aggravator)

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

Pre-#766 Make Picks had brand + context (+ optional tools) without the Lab/Scorecard tray. Adding the tertiary band is a durable **~56px** tax — painful when Chrome keeps that stack on-screen during keyboard, tolerable when Safari does not.

### 2) Bottom nav is `position: fixed; bottom: 0` — Chrome keeps it in the typing band

```491:492:src/app/layout/DashboardLayout.jsx
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 w-full border-t ... pb-[env(safe-area-inset-bottom,0px)] ...">
        <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} ... h-16`}>
```

Both browsers are WebKit-based on iOS, but **reporter evidence diverges**:

- **Chrome:** fixed primary nav sits **above** the keyboard and competes with the field.  
- **Safari:** that nav is **not** in the typing band; Safari’s own URL/accessory chrome sits on the keyboard stack instead.

So “fixed bottom always rides the layout-viewport offset on every WebKit browser” is too strong. Chrome’s combination of address-bar UI + viewport/offset behavior is what surfaces our footer during entry. We still opted into the worst case by **always showing** primary nav during text entry with no keyboard-aware hide.

There is **no** existing `visualViewport` / keyboard-open hook in the dashboard shell today.

### 3) Shell is a locked `100dvh` frame

```208:208:src/app/layout/DashboardLayout.jsx
    <div className="flex h-[100dvh] min-h-0 w-full ... overflow-hidden md:h-screen">
```

The scrollport is only `<main>`. When Chrome keeps header + footer in the visual viewport, there is almost no flex space for the focused field and zero spare room for an absolute dropdown. Safari’s presentation leaves that scrollport usable (field + list + peek of next sections).

### 4) Autocomplete cannot escape a Chrome squeeze

```209:213:src/shared/ui/SongAutocomplete.jsx
      {isOpen && filteredSongs.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto ..."
        >
```

Same `z-50` as bottom nav; opens downward only; not portaled. Under Chrome’s keyboard + bottom nav this list is clipped / covered. **Safari proves the component itself is fine** when vertical room exists — four rows render with full stats.

### 5) Chrome mobile UI shrinks the visual budget further

Reporter’s “new Google Chrome format” matches a taller address bar / browser chrome on iOS Chrome vs Safari’s compact floating URL pill. Environmental, not Tailwind — but it lowers the threshold where our fixed stack becomes unusable **in Chrome only**.

### Viewport meta note (Android vs iOS)

`app.html` / `index.html` use:

`width=device-width, initial-scale=1.0, viewport-fit=cover`

No `interactive-widget=…`. On **Chrome Android**, default since 108 is roughly `resizes-visual`. On **iOS Chrome/Safari**, `interactive-widget` is **not implemented** (WebKit). A meta-only fix will not equalize Chrome with Safari on iPhone; it may still be useful as a defensive Android opt-in later.

---

## Rough height math (Chrome failure)

Illustrative iPhone ~852 CSS px tall **when Chrome keeps our chrome visible**:

- Browser chrome + keyboard + system bars: often **~45–55%** of the screen when typing  
- Our fixed app chrome (top 15.25rem + bottom `h-16`): **~308px** before safe-area  
- Remainder for the pick field + suggestions: often **&lt; 100px** → matches the Chrome letterbox  

Safari avoids that failure by not presenting the same app chrome sandwich in the typing band — so the same `15.25rem` pad is not the binding constraint there.

---

## Options (recommended order)

### Option A — Hide primary bottom nav while keyboard is open (fast, high leverage)

**Idea:** Detect keyboard via `window.visualViewport` (height drop vs `window.innerHeight` / baseline `svh`, ignore pinch-zoom). When open, `translate-y-full` / `invisible` / `pointer-events-none` the mobile bottom `<nav>`, and shrink `<main>` bottom padding.

**Pros:** Moves Chrome closer to Safari’s “nav not in typing band”; reclaims ~64px + safe-area; small change in `DashboardLayout`.  
**Cons:** Needs careful threshold so collapsing URL bars do not flicker; must restore on blur.  
**Risk:** Low–medium.  
**Platforms:** Targets the Chrome evidence; should be a no-op or mild improvement on Safari.

### Option B — Picks “entry focus mode” (best Chrome parity with Safari comfort)

**Idea:** While any Make Picks `SongAutocomplete` is focused:

- Hide bottom nav (A)  
- Collapse or hide tertiary tray + “Picks saved” tools band  
- Optionally keep only brand or a slim “Done” / show label strip  
- Ensure the active field scrolls into the visual viewport  

**Pros:** Makes Chrome typing feel like Safari’s content-first band; largest readability win when Chrome insists on keeping top chrome.  
**Cons:** More product design; must not break lock/status discovery after blur.  
**Risk:** Medium. Natural owner: `features/picks` + layout shell hook.  

### Option C — Portal / flip autocomplete (defense in depth)

**Idea:** Render the suggestion list in a portal; position from `getBoundingClientRect()`; if space below &lt; N px, open **upward**; cap height to `visualViewport` remainder.

**Pros:** Hardens Chrome edge cases; Safari already works without this.  
**Cons:** Alone does **not** fix the crushed Chrome field.  
**Risk:** Medium (focus/blur, scroll, orientation).  

### Option D — CSS / viewport meta only (will not make Chrome = Safari on iOS)

| Lever | Effect |
|-------|--------|
| `interactive-widget=overlays-content` | Android opt-in; iOS ignore |
| `interactive-widget=resizes-content` | Android layout shrinks — can make fixed footers *worse* |
| Shell `100svh` instead of `100dvh` | Stabilizes frame; does not hide Chrome’s lifted bottom nav |
| `env(keyboard-inset-*)` / VirtualKeyboard API | Not an iOS Chrome fix |

**Recommendation:** Do **not** ship D alone.

### Option E — Permanent chrome declutter on Make Picks (IA tweak)

**Idea:** Reduce always-on height without waiting for keyboard (slim status band, tighter mins, etc.).

**Pros:** Helps Chrome even before focus.  
**Cons:** Touches dashboard IA; Safari evidence shows declutter is not required for a usable Safari path — prefer keyboard-scoped A/B first.

---

## Recommended plan

1. **Ship A + C together** as the first fix PR — primary goal: **Chrome iOS matches Safari’s usable typing band** (no bottom nav over the field; ≥3–4 suggestion rows). Re-verify Safari does not regress.  
2. **Follow with B** if Chrome still keeps brand/tertiary/status stacked and the field feels cramped after A.  
3. Keep **E** as optional polish.  
4. Skip relying on **D** for iPhone Chrome; re-evaluate Android only if QA diverges.

### Suggested acceptance checks

- **iPhone Chrome:** focus Set 1 Opener → field readable and **at least 3–4 suggestion rows** visible (Safari baseline); bottom nav not covering suggestions.  
- **iPhone Safari:** no regression vs current usable behavior (field + suggestions + predictive strip).  
- Android Chrome: same smoke; footer restores cleanly on blur.  
- Blur / navigate away: bottom nav and tertiary restore; no stuck `translate` or padding.  
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
- Expecting WebKit `interactive-widget` to equalize Chrome and Safari  

---

## Decision needed

Product/engineering pick among **A+C (recommended first PR)**, **A+B+C (max Chrome↔Safari parity)**, or **E-first IA change**. This document is the options brief; implementation should land in a separate `feat/<issue#>-…` PR against `staging` with PATCH/MINOR SemVer once behavior ships.
