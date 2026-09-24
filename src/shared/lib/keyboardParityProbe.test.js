import { describe, expect, it } from 'vitest';

import {
  keyboardParityDecision,
  readKeyboardParitySnapshot,
  shouldHidePrimaryNavAfterKeyboardSettle,
} from './keyboardParityProbe.js';

describe('readKeyboardParitySnapshot', () => {
  it('treats a nav above the visual bottom as inside the typing band', () => {
    const snap = readKeyboardParitySnapshot({
      clientHeight: 500,
      visualHeight: 500,
      offsetTop: 0,
      navTop: 420,
      navBottom: 484,
    });
    expect(snap.overlap).toBe(0);
    expect(snap.navInVisual).toBe(true);
  });

  it('treats a nav below the visual viewport as already panned away', () => {
    const snap = readKeyboardParitySnapshot({
      clientHeight: 800,
      visualHeight: 360,
      offsetTop: 80,
      navTop: 736,
      navBottom: 800,
    });
    expect(snap.overlap).toBe(360);
    expect(snap.navInVisual).toBe(false);
  });
});

describe('keyboardParityDecision', () => {
  it('hides the nav only when Chrome still shows it and Safari does not', () => {
    expect(
      keyboardParityDecision({ navInVisual: false }, { navInVisual: true }),
    ).toBe('hide-nav-when-inside-visual');
  });

  it('does not hide the nav when Chrome has already panned it away', () => {
    expect(
      keyboardParityDecision({ navInVisual: false }, { navInVisual: false }),
    ).toBe('measure-top-chrome');
  });
});

describe('shouldHidePrimaryNavAfterKeyboardSettle', () => {
  it('gates on navInVisual, including Chrome overlap 0 with the nav on screen', () => {
    const chrome = readKeyboardParitySnapshot({
      clientHeight: 352,
      visualHeight: 352,
      offsetTop: 0,
      navTop: 288,
      navBottom: 352,
    });
    expect(chrome.overlap).toBe(0);
    expect(chrome.navInVisual).toBe(true);
    expect(
      shouldHidePrimaryNavAfterKeyboardSettle({
        navInVisual: chrome.navInVisual,
        visualHeight: 352,
        restingVisualHeight: 714,
      }),
    ).toBe(true);

    const safari = readKeyboardParitySnapshot({
      clientHeight: 714,
      visualHeight: 377,
      offsetTop: 25,
      navTop: 650,
      navBottom: 714,
    });
    expect(safari.overlap).toBe(312);
    expect(safari.navInVisual).toBe(false);
    expect(
      shouldHidePrimaryNavAfterKeyboardSettle({
        navInVisual: safari.navInVisual,
        visualHeight: 377,
        restingVisualHeight: 714,
      }),
    ).toBe(false);
  });

  it('hides a top band that is still inside the visual viewport', () => {
    const chromeTop = readKeyboardParitySnapshot({
      clientHeight: 352,
      visualHeight: 352,
      offsetTop: 0,
      navTop: 0,
      navBottom: 220,
    });
    expect(chromeTop.navInVisual).toBe(true);
    expect(
      shouldHidePrimaryNavAfterKeyboardSettle({
        navInVisual: chromeTop.navInVisual,
        visualHeight: 352,
        restingVisualHeight: 714,
      }),
    ).toBe(true);
  });

  it('does not hide a top band Safari has already panned above the visual viewport', () => {
    const safariTop = readKeyboardParitySnapshot({
      clientHeight: 714,
      visualHeight: 377,
      offsetTop: 25,
      navTop: -180,
      navBottom: -8,
    });
    expect(safariTop.navInVisual).toBe(false);
    expect(
      shouldHidePrimaryNavAfterKeyboardSettle({
        navInVisual: safariTop.navInVisual,
        visualHeight: 377,
        restingVisualHeight: 714,
      }),
    ).toBe(false);
  });

  it('does not hide at rest when the nav is on screen but the keyboard is down', () => {
    expect(
      shouldHidePrimaryNavAfterKeyboardSettle({
        navInVisual: true,
        visualHeight: 714,
        restingVisualHeight: 714,
      }),
    ).toBe(false);
  });
});
