import { describe, expect, it } from 'vitest';

import { SPHERE_2026_RECAP_ID } from '../tour-recap';
import {
  getRecapTemplateDefinition,
  recapTemplateSupportsChannel,
  RECAP_TEMPLATE_REGISTRY,
} from './registry.js';

describe('RECAP_TEMPLATE_REGISTRY', () => {
  it('registers Sphere 2026 inaugural recap with all four channels', () => {
    const def = getRecapTemplateDefinition(SPHERE_2026_RECAP_ID);
    expect(def).toBeDefined();
    expect(def?.kind).toBe('tour');
    expect(def?.supportedChannels).toEqual(
      expect.arrayContaining(['inApp', 'emailAbbreviated', 'emailFull', 'push']),
    );
    expect(def?.sourceDraftPath).toContain('content/comms');
  });

  it('reports channel support', () => {
    expect(recapTemplateSupportsChannel(SPHERE_2026_RECAP_ID, 'push')).toBe(true);
    expect(recapTemplateSupportsChannel('nonexistent-id', 'push')).toBe(false);
  });

  it('keeps registry keys in sync with SPHERE_2026_RECAP_ID', () => {
    expect(Object.keys(RECAP_TEMPLATE_REGISTRY)).toContain(SPHERE_2026_RECAP_ID);
  });
});
