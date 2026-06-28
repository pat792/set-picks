import { describe, it, expect } from 'vitest';

import {
  COMMS_CHANNEL,
  COMMS_VARIANT_CONTROL,
  __commsDimensions,
  logCommsCtaClick,
  logCommsOpened,
  logCommsPrefChanged,
  logCommsPushTap,
} from './commsAnalytics.js';

describe('commsDimensions', () => {
  it('defaults channel to inApp and variant to control', () => {
    expect(__commsDimensions({ triggerId: 'show_recap', templateId: 'show-recap' })).toEqual({
      comms_trigger_id: 'show_recap',
      comms_template_id: 'show-recap',
      comms_channel: COMMS_CHANNEL.inApp,
      comms_variant: COMMS_VARIANT_CONTROL,
    });
  });

  it('omits empty ids but always sets channel + variant', () => {
    expect(__commsDimensions({})).toEqual({
      comms_channel: COMMS_CHANNEL.inApp,
      comms_variant: COMMS_VARIANT_CONTROL,
    });
  });

  it('honors explicit channel and variant', () => {
    expect(
      __commsDimensions({ templateId: 't', channel: COMMS_CHANNEL.email, variant: 'b' }),
    ).toMatchObject({ comms_channel: 'email', comms_variant: 'b' });
  });
});

describe('comms analytics loggers', () => {
  it('are no-ops without GA initialized (do not throw in node env)', () => {
    expect(() => logCommsOpened({ templateId: 'show-recap' })).not.toThrow();
    expect(() => logCommsCtaClick({ templateId: 'show-recap', cta: 'open' })).not.toThrow();
    expect(() => logCommsPushTap({ templateId: 'show-recap' })).not.toThrow();
    expect(() => logCommsPrefChanged({ prefKey: 'lifecycle', enabled: true })).not.toThrow();
  });
});
