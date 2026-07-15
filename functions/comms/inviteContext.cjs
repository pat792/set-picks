'use strict';

const { resolveEmailInviteShare } = require('./inviteKit.cjs');

/**
 * First pool invite code + name for a user (same pool order as marketing batch).
 *
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {Record<string, unknown> | null | undefined} userData
 * @returns {Promise<{ inviteCode: string | null, poolName: string | null }>}
 */
async function inviteContextForUser(db, userData) {
  const poolIds = Array.isArray(userData?.pools) ? userData.pools : [];
  if (poolIds.length === 0) return { inviteCode: null, poolName: null };
  const poolSnap = await db.collection('pools').doc(String(poolIds[0])).get();
  if (!poolSnap.exists) return { inviteCode: null, poolName: null };
  const data = poolSnap.data() || {};
  const code =
    typeof data.inviteCode === 'string' && data.inviteCode.trim()
      ? data.inviteCode.trim().toUpperCase()
      : null;
  const poolName =
    typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null;
  return { inviteCode: code, poolName };
}

/**
 * Build invite payload fields for email templates from user + pool context.
 *
 * @param {{
 *   baseUrl?: string,
 *   inviterHandle?: string,
 *   inviteCode?: string | null,
 *   poolName?: string | null,
 *   campaign: string,
 *   utmContent?: string,
 * }} opts
 * @returns {Record<string, string> | null}
 */
function buildInviteEmailFields(opts) {
  const share = resolveEmailInviteShare(opts);
  if (!share) return null;
  return {
    invite_kind: share.invite_kind,
    invite_url: share.invite_url,
    invite_headline: share.invite_headline,
    ...(opts.inviteCode ? { invite_code: String(opts.inviteCode).trim().toUpperCase() } : {}),
    ...(opts.poolName ? { pool_name: String(opts.poolName).trim() } : {}),
    ...(opts.inviterHandle ? { inviter_handle: String(opts.inviterHandle).trim() } : {}),
  };
}

/**
 * Resolve invite share from a template payload (pre-enriched or inline vars).
 *
 * @param {Record<string, unknown>} payload
 * @param {{ campaign: string, baseUrl?: string, utmContent?: string }} opts
 * @returns {{ invite_kind: 'site' | 'pool', invite_url: string, invite_headline: string } | null}
 */
function resolveInviteShareFromPayload(payload, { campaign, baseUrl, utmContent }) {
  if (typeof payload?.invite_url === 'string' && payload.invite_url.trim()) {
    return {
      invite_kind: payload.invite_kind === 'pool' ? 'pool' : 'site',
      invite_url: payload.invite_url.trim(),
      invite_headline:
        typeof payload.invite_headline === 'string' && payload.invite_headline.trim()
          ? payload.invite_headline.trim()
          : '',
    };
  }
  const handle =
    typeof payload?.inviter_handle === 'string' && payload.inviter_handle.trim()
      ? payload.inviter_handle.trim()
      : typeof payload?.handle === 'string'
        ? payload.handle.trim()
        : '';
  const inviteCode =
    typeof payload?.invite_code === 'string' && payload.invite_code.trim()
      ? payload.invite_code.trim()
      : null;
  const poolName =
    typeof payload?.pool_name === 'string' && payload.pool_name.trim()
      ? payload.pool_name.trim()
      : null;
  return resolveEmailInviteShare({
    baseUrl,
    inviterHandle: handle,
    inviteCode,
    poolName,
    campaign,
    utmContent,
  });
}

module.exports = {
  inviteContextForUser,
  buildInviteEmailFields,
  resolveInviteShareFromPayload,
};
