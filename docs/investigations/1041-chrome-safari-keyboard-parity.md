# #1041 — Chrome / Safari keyboard parity measurement

**Status:** measured 2026-09-23 on iPhone, feature preview `set-picks-m9ti5wq0z`. Decision below.  
**Do not merge** the `?kbProbe=1` readout as the fix.

## What is already proven

Safari on this shell is the target. With the keyboard open, the field and suggestion list are usable and our bottom nav is not in that band.

Chrome on the same screen keeps the primary nav in the band above the keyboard and leaves the field crushed.

These attempts made Safari worse and are withdrawn:

- Hiding the tertiary tray or cutting scrollport padding on focus. The field moves under the finger, so the first tap never opens the keyboard.
- Portaling the suggestion list. The list detaches from the field.
- Hiding the nav in the same turn as the tap. Safari was already correct; the extra change still disturbed it.
- Gating on `clientHeight - visualViewport.height - offsetTop`. On the Chrome phone that nav stayed visible, so that overlap number did not describe the failure.

## The one measurement

Open Make Picks with `?kbProbe=1` on the feature-branch preview. The black strip only prints numbers. It does not hide chrome or move the list.

On **Safari** and **Chrome**, same phone, same show:

1. Tap Set 1 Opener.
2. Wait until the keyboard is fully up.
3. Screenshot the black strip.

| Line | Meaning |
|------|---------|
| `navInVisual YES/NO` | Is the primary nav inside the visible screen? |
| `overlap` | Layout height minus visual height minus pan. The gate that already failed to match Chrome. |
| `vv / off / scale` | Visual viewport height, `offsetTop`, pinch scale. |
| `input` | Focused field top and bottom. |

## Measured (keyboard fully up, Set 1 Opener focused)

| | Safari | Chrome |
|--|--------|--------|
| `navInVisual` | NO (nav not in the band; line was clipped, photo shows no nav) | **YES** |
| `overlap` | 312 | **0** |
| visual height / offsetTop | 377 / 25 | 352 / 0 |
| `clientHeight` / `innerHeight` | 714 / 689 | 352 / 352 |
| input top–bottom | 162–214 | 309–361 |

Chrome has shrunk the layout viewport to the visible screen (`client` = `vv` = `inner` = 352), so the overlap gate stays 0 while the nav is still inside that screen. The field bottom (361) is past the visual bottom (352). Safari keeps a tall layout (714) and pans, so the nav falls outside the 377px visual viewport and the field sits at 162–214.

## What the pair of screenshots decides (superseded by Decision below)

| Safari `navInVisual` | Chrome `navInVisual` | The fix |
|----------------------|----------------------|---------|
| NO | YES | After the keyboard has settled, if the nav box is inside the visual viewport, hide **only** that nav. Do not run this on the tap. Do not change padding, the tertiary tray, or the suggestion list. Safari never enters this branch. |
| NO | NO | The nav is not the crush. Repeat the probe on the brand bar, date bar, and tertiary tray. Hide only the bands whose rects are inside the visual viewport on Chrome and outside it on Safari. Same timing rule. |
| YES | YES | Unexpected. Safari would be showing the nav, which the earlier screenshots do not. Recheck that the keyboard was fully up. |

Measured pair is **NO / YES** → hide the primary nav after the keyboard settles, when `navInVisual` is true.

Device check on that build: bottom nav hides on most taps, sometimes stays; top stack never leaves; form still short. Safari drops both.

## Why Chrome and Safari differ (research, 2026-09-23)

Both are WebKit. Shipping Chrome for iOS 153 (Sept 2026) is still WKWebView; the Blink port is a prototype, not what users run. The difference is how each app frames the web view when the keyboard is up.

- **Safari**: keeps the layout viewport at full height and pans it. Our probe: `clientHeight` 714, visual 377, `offsetTop` 25. Fixed top stack and bottom nav are anchored to the tall layout viewport, so the pan carries them out of the visible band. This is the "resize visual, offset layout" model in Chrome's own viewport blog.
- **Chrome iOS**: sizes its web view to the keyboard-free screen. Our probe: `clientHeight` 352 = visual 352, `offsetTop` 0. That is the "resize both viewports" model. Every `position: fixed` band stays on screen, `100dvh` shrinks to 352, and the scrollport keeps its reserved padding (15.25rem top + ~4.5rem bottom ≈ 316px), leaving the form a few dozen pixels.

The published claim that Chrome iOS matches Safari is about Chrome 108 on Android; it does not describe the iPhone shell we measured. `interactive-widget` does not exist in WebKit (bug 259770), so no meta tag changes this. The pre-tertiary shell reserved 9rem instead of 15.25rem, which is why the same Chrome model was survivable before the nav changes and is not now.

## Decision

Gate on the thing only Chrome does: `documentElement.clientHeight` dropping ≥150px from its resting value. Safari never trips it. When it trips (after settle, never on the tap):

1. Hide the top stack and the bottom nav.
2. Release the scrollport's reserved top/bottom padding.
3. Hold the focused field where it was by shifting `scrollTop` by the same delta.

When `clientHeight` returns, restore all three. The bottom nav keeps the rect gate as a fallback.

Withdrawn today: gating the top stack on its rect. Safari's pan leaves that rect partly inside the visual viewport, so the top stack was hidden and the padding dropped while the finger was down. That was the frozen first tap.

`?kbProbe=1` stays a readout.
