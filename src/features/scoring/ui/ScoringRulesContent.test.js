import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ScoringRulesContent from './ScoringRulesContent.jsx';

describe('ScoringRulesContent', () => {
  it('defaults to dark modal surface (uppercase product title)', () => {
    const html = renderToStaticMarkup(React.createElement(ScoringRulesContent));
    expect(html).toContain('How Scoring Works');
    expect(html).toContain('bg-surface-panel');
    expect(html).not.toContain('bg-white');
  });

  it('renders light editorial surface for marketing (#944)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ScoringRulesContent, { surface: 'light' }),
    );
    expect(html).toContain('How scoring works');
    expect(html).toContain('bg-white');
    expect(html).not.toContain('bg-surface-panel');
  });

  it('can omit intro so marketing pages own the H1 (#944)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ScoringRulesContent, {
        surface: 'light',
        includeIntro: false,
      }),
    );
    expect(html).not.toContain('scoring-rules-heading');
    expect(html).toContain('In setlist');
    expect(html).toContain('bg-white');
  });
});
