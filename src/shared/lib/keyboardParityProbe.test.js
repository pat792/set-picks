import { describe, expect, it } from 'vitest';

import {
  keyboardParityDecision,
  readKeyboardParitySnapshot,
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
