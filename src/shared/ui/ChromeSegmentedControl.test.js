import { describe, expect, it } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';

import ChromeSegmentedControl from './ChromeSegmentedControl.jsx';

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

describe('ChromeSegmentedControl (#765 tertiary chrome)', () => {
  it('renders an equal-width tablist with active ring/fill and aria', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChromeSegmentedControl, {
        ariaLabel: 'Standings view',
        value: 'tour',
        items: [
          { id: 'show', label: 'Show' },
          { id: 'tour', label: 'Tour' },
          { id: 'stats', label: 'Stats' },
          { id: 'pools', label: 'Pools' },
        ],
      }),
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Standings view"');
    expect(count(html, 'role="tab"')).toBe(4);
    expect(count(html, 'aria-selected="true"')).toBe(1);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('flex-1');
    expect(count(html, 'flex-1')).toBe(4);
    expect(html).toContain('uppercase');
    expect(html).toContain('ring-brand-primary/35');
    expect(html).toContain('bg-brand-primary/15');
    expect(html).not.toContain('rounded-full');
    expect(html).toContain('Show');
    expect(html).toContain('Tour');
    expect(html).toContain('Stats');
    expect(html).toContain('Pools');
  });

  it('renders a nav of equal-width NavLinks for route clusters', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/dashboard/profile'] },
        React.createElement(ChromeSegmentedControl, {
          ariaLabel: 'Profile sections',
          items: [
            { to: '/dashboard/profile', label: 'Profile', end: true },
            {
              to: '/dashboard/profile/notifications',
              label: 'Messages',
              end: true,
            },
            { to: '/dashboard/profile/account', label: 'Account', end: true },
          ],
        }),
      ),
    );

    expect(html).toContain('aria-label="Profile sections"');
    expect(html).toContain('<nav');
    expect(html).not.toContain('role="tablist"');
    expect(count(html, 'flex-1')).toBe(3);
    expect(html).toContain('uppercase');
    expect(html).toContain('ring-brand-primary/35');
    expect(html).toContain('Profile');
    expect(html).toContain('Messages');
    expect(html).toContain('Account');
  });
});
