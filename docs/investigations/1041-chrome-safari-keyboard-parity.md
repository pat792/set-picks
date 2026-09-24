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

## What the pair of screenshots decides

| Safari `navInVisual` | Chrome `navInVisual` | The fix |
|----------------------|----------------------|---------|
| NO | YES | After the keyboard has settled, if the nav box is inside the visual viewport, hide **only** that nav. Do not run this on the tap. Do not change padding, the tertiary tray, or the suggestion list. Safari never enters this branch. |
| NO | NO | The nav is not the crush. Repeat the probe on the brand bar, date bar, and tertiary tray. Hide only the bands whose rects are inside the visual viewport on Chrome and outside it on Safari. Same timing rule. |
| YES | YES | Unexpected. Safari would be showing the nav, which the earlier screenshots do not. Recheck that the keyboard was fully up. |

Measured pair is **NO / YES** → hide the primary nav after the keyboard settles, when `navInVisual` is true.

Device check on that build: Chrome bottom nav hides, and the field is still short because the brand, date, and Make Picks bars stay in the visual viewport. Safari pans that top stack out as well. Same rule, second band: after settle, if the top stack’s rect is inside the visual viewport, hide it and release the scrollport’s reserved top padding. Do not run this on the tap. Safari’s top stack is already outside the visual viewport, so it does not enter this branch.
