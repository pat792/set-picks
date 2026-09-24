# Brief: iOS Chrome vs Safari virtual keyboard on a fixed-chrome web shell

**Status:** resolved on device 2026-09-23 (#1041, PR #1048). Written so another model or engineer can reason about this without the chat history.  
**Related:** `docs/investigations/1041-chrome-safari-keyboard-parity.md` (measurements), `docs/investigations/mobile-chrome-keyboard-picks-chrome.md` (original options A–E).

## The symptom

A mobile web app (React SPA, Vercel) with:

- an outer shell `height: 100dvh; overflow: hidden`
- a `position: fixed; top: 0` stack (brand bar, date bar, section tabs) ≈ 15.25rem tall
- a `position: fixed; bottom: 0` primary nav ≈ 4rem tall
- one scrolling `<main>` between them, with `padding-top` / `padding-bottom` reserving the space under those fixed bands
- text inputs with an in-flow autocomplete list under the focused field

On **iPhone Safari**, tapping an input opens the keyboard, the fixed bands leave the screen, and the field plus list are usable.  
On **iPhone Chrome** (same phone, same page), the fixed bands stay on screen above the keyboard and the field has a few dozen pixels.

## What the published guidance says, and why it misled

Chrome's "viewport resize behavior" blog (Chrome 108) says Chrome on iOS and Safari on iOS share the model "resize only the visual viewport, offset the layout viewport." Many answers repeat that, and add that `interactive-widget` in the viewport meta is the switch.

Two problems for this case:

1. `interactive-widget` is unimplemented in WebKit (WebKit bug 259770). Chrome on iOS is a WKWebView, so it is not a lever here.
2. The "same model" claim is about the **engine default** when the host app leaves the web view alone. It says nothing about what each **app** does to the web view's frame while the keyboard is up. Chrome's iOS app frames its web view differently from Safari; that is the whole difference.

Shipping Chrome for iOS (153, Sept 2026) is still WebKit. The Blink-on-iOS port is a research prototype; do not reach for Blink-specific fixes.

## What was measured (the part that mattered)

Instrument the page with `visualViewport` and `documentElement.clientHeight`, focus the input, wait for the keyboard to finish, read:

| | Safari | Chrome |
|--|--------|--------|
| `documentElement.clientHeight` (layout viewport) | **714** | **352** |
| `visualViewport.height` | 377 | 352 |
| `visualViewport.offsetTop` | 25 | 0 |
| bottom nav inside the visible area | no | yes |
| focused input top–bottom | 162–214 | 309–361 (bottom past the visible edge) |

Both columns are keyboard-up. Rest was not photographed separately; the same phone at rest in a browser tab reports `clientHeight` ≈ 714 in both browsers (Safari's 714 is that rest value carried through). Sample: one iPhone, portrait, in a browser tab. Not iPad, not landscape, not home-screen standalone.

Reading:

- **Safari** keeps the layout viewport tall (714) and **pans** it (offsetTop 25). Fixed bands are anchored to that tall layout viewport, so the pan carries them out of the visible band. The page did not shrink.
- **Chrome** **shrinks the layout viewport to the keyboard-free area** (714 → 352, no pan). That is the "resize both viewports" model. Every `position: fixed` band is still on screen, `100dvh` collapses to 352px, and `<main>` keeps its reserved padding (≈244 + ≈72 = 316px), leaving ~36px for content.

So the same CSS meets two different viewport models. Nothing in the app is "wrong" for one and "right" for the other; the app only budgeted for Safari's.

It surfaced when the fixed top stack grew from 9rem to 15.25rem. The Chrome model was always there; there used to be enough slack to survive it.

## What did not work, and why (do not repeat)

| Attempt | Result | Why |
|--------|--------|-----|
| Hide bands / cut padding on focus or tap | first tap froze, keyboard never opened | layout moved under the finger before the tap completed |
| Portal the autocomplete list to `body` | list floated away from the field, submit button rode up | list left the field's scroll context |
| Gate on `clientHeight - visualViewport.height - offsetTop` ("overlap") | 0 on Chrome, so never fired | Chrome shrinks `clientHeight` too; the formula assumes the layout viewport stays tall |
| Gate on "is this band's rect inside the visual viewport" | Safari froze on first tap; Chrome nav flickered | Safari's pan leaves the top stack partly inside the visual viewport, so it hid there too; also races the keyboard animation |
| `interactive-widget=resizes-visual` | no effect | not implemented in WebKit |

## The fix that held

Gate on the **model**, not the browser name: **`documentElement.clientHeight` drops ≥150px from its resting value while a text-entry element is focused.** Safari in a tab does not do this (714 stays 714). If some other host (home-screen standalone, another wrapper) shrinks the layout viewport the same way, it needs the same treatment, so the gate is correct there too.

150px: above the URL-bar collapse (~25px), below any keyboard. Resting value is captured at mount and only ratchets up (`Math.max`), so a rest captured while the keyboard is already open will self-correct on the first dismiss.

Timing: run after `visualViewport` `resize`/`scroll` settle (~160ms debounce). Never on focus, never on the tap.

When it trips:

1. Hide the fixed top stack and bottom nav (`visibility: hidden` + `pointer-events: none` + `aria-hidden`). The overlay boxes stay, so the fixed layer does not reflow.
2. Release `<main>`'s reserved `padding-top` / `padding-bottom` to a small value. This is the one intended reflow.
3. Hold the focused field where it was: read its `getBoundingClientRect().top` before step 2, again after, and add the delta to `scrollTop`.

When `clientHeight` returns to rest, undo all three. On `orientationchange`, show everything, zero the resting values, recapture after ~300ms.

Fallback still in the code: the bottom nav alone also hides when the **visual** height drops ≥150px and the nav's rect is still inside the visual viewport. This is the only path that can touch Safari, and only if the 160ms settle fires mid-animation while the nav is still in view.

On Safari in a tab the main path does nothing, which is the point: Safari already behaves the way we want.

## Known limits (reviewed 2026-09-23)

- iPad and split view show this mobile chrome under 768px. A frame shrink there without a keyboard is filtered by the text-entry-focused check.
- Floating or hardware keyboards may shrink less than 150px or not at all. Chrome then keeps its bands; same as before this fix.
- Landscape iPhone is not covered by these numbers.

## How to tell which browser model you are in, generically

```js
const vv = window.visualViewport;
const restingClient = document.documentElement.clientHeight; // capture at rest
// after keyboard settles:
const client = document.documentElement.clientHeight;
const layoutShrunk = restingClient - client >= 150;     // Chrome iOS model
const visualOnly = !layoutShrunk && restingClient - vv.height >= 150; // Safari model
```

`layoutShrunk` means fixed bands and `dvh` boxes have already been squeezed; give the content the reserved space back.  
`visualOnly` means the browser panned; fixed bands are already off-screen. Leave the layout alone.

## Guardrails for anyone touching this

- Do not move layout in the same turn as the tap.
- Do not gate on element rectangles when a pan is possible; gate on `clientHeight`.
- Do not portal the autocomplete list.
- Safari is the target behavior. Any change that alters Safari is wrong by definition.
