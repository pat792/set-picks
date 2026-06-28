/**
 * Client-side comms measurement (MEASURE layer).
 *
 * Mirrors `docs/comms-triggers/MEASUREMENT_PLAN.md`. The server logs `comms_delivered`
 * (see `functions/commsDelivery.js`); the client owns the engagement half of the funnel:
 *
 *   Delivered (server) → Opened → CTA click / Push tap → (Dismissed)
 *
 * Every event carries the comms custom dimensions so funnels can pivot by trigger,
 * template, channel and variant. v1 templates are single-variant, so `comms_variant`
 * defaults to `control` (keeps the schema A/B-ready for Phase 2 / EXPERIMENT_PLAYBOOK).
 */

import { ga4Event } from '../../../shared/lib/ga4';

/** Default variant for single-variant v1 templates. */
export const COMMS_VARIANT_CONTROL = 'control';

/** Channel ids used across the comms stack (match catalog `channels`). */
export const COMMS_CHANNEL = Object.freeze({
  inApp: 'inApp',
  push: 'push',
  email: 'email',
});

/**
 * @typedef {object} CommsEventMeta
 * @property {string} [triggerId]   Catalog triggerId (e.g. `show_recap`).
 * @property {string} [templateId]  Registry templateId (e.g. `show-recap`).
 * @property {string} [channel]     One of COMMS_CHANNEL values. Defaults to `inApp`.
 * @property {string} [variant]     A/B variant. Defaults to `control`.
 */

/**
 * Build the shared GA4 custom-dimension params. Omits empty ids so GA4 doesn't
 * record blank dimension values.
 *
 * @param {CommsEventMeta} meta
 */
function commsDimensions({ triggerId, templateId, channel, variant } = {}) {
  const params = {};
  if (triggerId) params.comms_trigger_id = triggerId;
  if (templateId) params.comms_template_id = templateId;
  params.comms_channel = channel || COMMS_CHANNEL.inApp;
  params.comms_variant = variant || COMMS_VARIANT_CONTROL;
  return params;
}

/** User opened / expanded a message (in-app inbox or push-deep-linked open). */
export function logCommsOpened(meta) {
  ga4Event('comms_opened', commsDimensions(meta));
}

/** User dismissed a message without taking the primary action. */
export function logCommsDismissed(meta) {
  ga4Event('comms_dismissed', commsDimensions(meta));
}

/**
 * User clicked the message's primary CTA.
 *
 * @param {CommsEventMeta & { cta?: string }} meta
 */
export function logCommsCtaClick(meta) {
  const params = commsDimensions(meta);
  if (meta?.cta) params.comms_cta = meta.cta;
  ga4Event('comms_cta_click', params);
}

/** User tapped a push notification (channel forced to `push`). */
export function logCommsPushTap(meta) {
  ga4Event('comms_push_tap', commsDimensions({ ...meta, channel: COMMS_CHANNEL.push }));
}

/**
 * User changed a notification preference toggle.
 *
 * @param {{ prefKey: string, enabled: boolean }} meta
 */
export function logCommsPrefChanged({ prefKey, enabled } = {}) {
  ga4Event('comms_pref_changed', {
    comms_pref_key: prefKey || '',
    comms_pref_enabled: enabled ? 1 : 0,
  });
}

/** Exported for tests / dev tooling. */
export { commsDimensions as __commsDimensions };
