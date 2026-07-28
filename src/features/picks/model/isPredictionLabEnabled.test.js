import { afterEach, describe, expect, it, vi } from 'vitest';

describe('isPredictionLabEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is false when unset', async () => {
    vi.stubEnv('VITE_ENABLE_PREDICTION_LAB', undefined);
    const { isPredictionLabEnabled } = await import('./isPredictionLabEnabled.js');
    expect(isPredictionLabEnabled()).toBe(false);
  });

  it('is false for non-true strings', async () => {
    vi.stubEnv('VITE_ENABLE_PREDICTION_LAB', 'false');
    const { isPredictionLabEnabled } = await import('./isPredictionLabEnabled.js');
    expect(isPredictionLabEnabled()).toBe(false);
  });

  it('is true only for the string true', async () => {
    vi.stubEnv('VITE_ENABLE_PREDICTION_LAB', 'true');
    const { isPredictionLabEnabled } = await import('./isPredictionLabEnabled.js');
    expect(isPredictionLabEnabled()).toBe(true);
  });
});
