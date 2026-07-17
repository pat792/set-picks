import { describe, it, expect } from 'vitest';

import {
  COMMS_TEMPLATE_REGISTRY,
  getCommsTemplateEntry,
  listCommsTemplateIds,
  triggerIdForTemplate,
} from './commsTemplateRegistry.jsx';
import { buildTourRankingsDailyParagraphs } from '../../model/tourRankingsDailyCopy';

const EXPECTED_TEMPLATE_IDS = [
  'account-welcome',
  'tour-countdown',
  'picks-confirmed',
  'score-first-points',
  'score-leader',
  'show-recap',
  'tour-rankings-daily',
  'picks-lock-reminder',
  'tour-engagement-reminder',
  'sphere-2026-inaugural',
];

describe('comms template registry', () => {
  it('registers every v1 catalog template', () => {
    for (const id of EXPECTED_TEMPLATE_IDS) {
      expect(listCommsTemplateIds()).toContain(id);
    }
  });

  it('each entry has a triggerId, displayName, samples, and a renderer', () => {
    for (const id of listCommsTemplateIds()) {
      const entry = COMMS_TEMPLATE_REGISTRY[id];
      expect(entry.triggerId, `${id} triggerId`).toBeTruthy();
      expect(entry.displayName, `${id} displayName`).toBeTruthy();
      expect(entry.samples.length, `${id} samples`).toBeGreaterThan(0);
      expect(Boolean(entry.build) || Boolean(entry.Component), `${id} renderer`).toBe(true);
    }
  });

  it('build templates return a renderable structure for their samples', () => {
    for (const id of listCommsTemplateIds()) {
      const entry = COMMS_TEMPLATE_REGISTRY[id];
      if (!entry.build) continue;
      for (const sample of entry.samples) {
        const result = entry.build(sample.payload);
        expect(result, `${id}/${sample.name}`).toBeTypeOf('object');
        expect(result.title, `${id}/${sample.name} title`).toBeTruthy();
        expect(Array.isArray(result.paragraphs), `${id} paragraphs`).toBe(true);
      }
    }
  });

  it('build templates never throw on an empty payload and fall back to a handle', () => {
    for (const id of listCommsTemplateIds()) {
      const entry = COMMS_TEMPLATE_REGISTRY[id];
      if (!entry.build) continue;
      const result = entry.build({});
      // Welcome puts the handle in the title; others use it in a paragraph.
      const text = [result.title, ...(result.paragraphs || [])].join(' ');
      expect(text, `${id} fallback handle`).toContain('Picker');
    }
  });

  it('tour countdown in-app CTA varies by days_remaining (never "Open the app")', () => {
    const entry = getCommsTemplateEntry('tour-countdown');
    expect(entry.build({ days_remaining: 10 }).cta).toEqual({
      label: 'View upcoming shows',
      href: '/dashboard/picks',
    });
    expect(entry.build({ days_remaining: 5 }).cta.label).toBe('Make picks for show 1');
    expect(entry.build({ days_remaining: 3 }).cta.label).toBe('Make picks for show 1');
    expect(entry.build({ days_remaining: 1 }).cta.label).toBe('Lock in your picks');
  });

  it('tour countdown T-5/T-3/T-1 uses View / Edit picks when picks_secured (#509)', () => {
    const entry = getCommsTemplateEntry('tour-countdown');
    expect(entry.build({ days_remaining: 5, picks_secured: true }).cta).toEqual({
      label: 'View / Edit picks',
      href: '/dashboard/picks',
    });
    expect(entry.build({ days_remaining: 3, picks_secured: true }).cta.label).toBe(
      'View / Edit picks',
    );
    expect(entry.build({ days_remaining: 1, picks_secured: true }).cta.label).toBe(
      'View / Edit picks',
    );
    // T-10 stays exploratory even if secured
    expect(entry.build({ days_remaining: 10, picks_secured: true }).cta.label).toBe(
      'View upcoming shows',
    );
  });

  it('tour engagement reminder uses in-app picks CTA (not "Open the app")', () => {
    const entry = getCommsTemplateEntry('tour-engagement-reminder');
    expect(entry.build({}).cta).toEqual({
      label: 'Make picks for next show',
      href: '/dashboard/picks',
    });
    expect(entry.build({ picks_secured: true }).cta).toEqual({
      label: 'View / Edit picks',
      href: '/dashboard/picks',
    });
  });

  it('picks-lock-reminder CTA switches when picks_secured (#509)', () => {
    const entry = getCommsTemplateEntry('picks-lock-reminder');
    expect(entry.build({}).cta.label).toBe('Make your picks');
    expect(entry.build({ picks_secured: true }).cta.label).toBe('View / Edit picks');
  });

  it('show_recap CTA is honest about standings destination (#551)', () => {
    const entry = getCommsTemplateEntry('show-recap');
    expect(entry.build({}).cta).toEqual({
      label: 'See standings',
      href: '/dashboard/standings#self-recap',
    });
  });

  it('welcome + picks-confirmed CTAs deep-link to picks (#551)', () => {
    expect(getCommsTemplateEntry('account-welcome').build({}).cta.href).toBe(
      '/dashboard/picks',
    );
    expect(getCommsTemplateEntry('picks-confirmed').build({}).cta.href).toBe(
      '/dashboard/picks',
    );
  });

  it('tour rankings preview dedupes combined-copy place labels (#584)', () => {
    const paragraphs = buildTourRankingsDailyParagraphs(
      {
        handle: 'RiverTranced',
        show_date: '2026-07-19',
        venue_name: 'MSG',
        venue_city: 'New York, NY',
        tour_rank: 3,
        total_tour_pickers: 50,
        tour_points: 210,
        rank_change: 'up 2',
        next_show_date: '2026-07-20',
        next_show_venue: 'MSG',
      },
      { omitHandle: true }
    );
    const text = paragraphs.join(' ');

    expect(text).toContain("After last night's show you climbed 2 spots.");
    expect(text).toContain('Back at MSG 2026-07-20.');
    expect(text).not.toContain('After New York, NY');
    expect(text).not.toContain('Next up: 2026-07-20 — MSG');
  });

  it('maps templateId → catalog triggerId', () => {
    expect(triggerIdForTemplate('show-recap')).toBe('show_recap');
    expect(triggerIdForTemplate('account-welcome')).toBe('account_welcome');
    expect(triggerIdForTemplate('nope')).toBeUndefined();
  });

  it('sphere recap uses a bespoke component with coerced props', () => {
    const entry = getCommsTemplateEntry('sphere-2026-inaugural');
    expect(entry.Component).toBeTypeOf('function');
    const props = entry.toComponentProps({ rank: '3', points: '120', wins: '2', showsPlayed: '9' });
    expect(props).toMatchObject({ rank: 3, points: 120, wins: 2, showsPlayed: 9 });
  });
});
