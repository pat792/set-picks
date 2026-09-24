import { describe, expect, it } from 'vitest';

import {
  isVirtualKeyboardOpen,
  layoutViewportKeyboardOverlap,
  placeAutocompleteMenu,
} from './keyboardViewport.js';

describe('layoutViewportKeyboardOverlap', () => {
  it('includes visual-viewport pan', () => {
    expect(layoutViewportKeyboardOverlap(800, 400, 40)).toBe(360);
  });

  it('clamps when the layout already matches the visual viewport', () => {
    expect(layoutViewportKeyboardOverlap(500, 500, 0)).toBe(0);
  });
});

describe('isVirtualKeyboardOpen', () => {
  it('ignores URL-bar collapse and pinch zoom', () => {
    expect(isVirtualKeyboardOpen({ overlap: 80, scale: 1 })).toBe(false);
    expect(isVirtualKeyboardOpen({ overlap: 320, scale: 1.4 })).toBe(false);
  });

  it('treats a large visual overlap as the keyboard', () => {
    expect(isVirtualKeyboardOpen({ overlap: 320, scale: 1 })).toBe(true);
  });
});

describe('placeAutocompleteMenu', () => {
  it('opens downward when the visual viewport has room', () => {
    const placed = placeAutocompleteMenu({
      anchorTop: 100,
      anchorBottom: 140,
      anchorLeft: 16,
      anchorWidth: 300,
      visualHeight: 700,
    });
    expect(placed.openUp).toBe(false);
    expect(placed.top).toBe(148);
    expect(placed.maxHeight).toBe(256);
  });

  it('flips upward and caps to the visual gap when the keyboard crowds the field', () => {
    const placed = placeAutocompleteMenu({
      anchorTop: 220,
      anchorBottom: 260,
      anchorLeft: 12,
      anchorWidth: 280,
      visualTop: 0,
      visualHeight: 320,
    });
    expect(placed.openUp).toBe(true);
    expect(placed.maxHeight).toBe(212);
    expect(placed.top).toBe(0);
    expect(placed.left).toBe(12);
    expect(placed.width).toBe(280);
  });
});
