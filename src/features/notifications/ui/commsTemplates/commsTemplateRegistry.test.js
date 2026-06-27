import { describe, it, expect } from 'vitest';

import {
  COMMS_TEMPLATE_REGISTRY,
  getCommsTemplateEntry,
  listCommsTemplateIds,
  triggerIdForTemplate,
} from './commsTemplateRegistry.jsx';

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
