import React, { useEffect, useState } from 'react';

import { readKeyboardParitySnapshot } from '../../../shared/lib/keyboardParityProbe';

function measure() {
  const vv = window.visualViewport;
  const nav = document.querySelector('[data-mobile-primary-nav]');
  const navRect = nav?.getBoundingClientRect() ?? null;
  const input = document.activeElement;
  const inputRect =
    input instanceof HTMLInputElement ? input.getBoundingClientRect() : null;
  const visualHeight = vv?.height ?? window.innerHeight;
  const snap = readKeyboardParitySnapshot({
    clientHeight: document.documentElement.clientHeight,
    visualHeight,
    offsetTop: vv?.offsetTop ?? 0,
    navTop: navRect ? navRect.top : null,
    navBottom: navRect ? navRect.bottom : null,
  });
  return {
    ...snap,
    visualHeight: Math.round(visualHeight),
    offsetTop: Math.round(vv?.offsetTop ?? 0),
    scale: vv?.scale ?? 1,
    clientHeight: document.documentElement.clientHeight,
    innerHeight: window.innerHeight,
    inputTop: inputRect ? Math.round(inputRect.top) : null,
    inputBottom: inputRect ? Math.round(inputRect.bottom) : null,
  };
}

/**
 * On-screen readout for #1041. Mount only with `?kbProbe=1`.
 * Does not hide chrome, change padding, or move the suggestion list.
 */
export default function MobileKeyboardProbe() {
  const [row, setRow] = useState(null);

  useEffect(() => {
    const tick = () => setRow(measure());
    tick();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', tick);
    vv?.addEventListener('scroll', tick);
    window.addEventListener('focusin', tick);
    window.addEventListener('focusout', tick);
    return () => {
      vv?.removeEventListener('resize', tick);
      vv?.removeEventListener('scroll', tick);
      window.removeEventListener('focusin', tick);
      window.removeEventListener('focusout', tick);
    };
  }, []);

  if (!row) return null;

  const lines = [
    `navInVisual ${row.navInVisual ? 'YES' : 'NO'}`,
    `overlap ${row.overlap}`,
    `vv ${row.visualHeight} off ${row.offsetTop} scale ${row.scale}`,
    `client ${row.clientHeight} inner ${row.innerHeight}`,
    `input ${row.inputTop ?? '—'}–${row.inputBottom ?? '—'}`,
  ];

  return (
    <pre
      data-kb-probe
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 80,
        margin: 0,
        maxWidth: '100%',
        padding: '4px 6px',
        fontSize: 11,
        lineHeight: 1.35,
        color: '#fff',
        background: 'rgba(0,0,0,0.82)',
        pointerEvents: 'none',
      }}
    >
      {lines.join('\n')}
    </pre>
  );
}
