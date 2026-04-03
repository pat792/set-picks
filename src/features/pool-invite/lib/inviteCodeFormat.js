/**
 * Matches pools `inviteCode` generator charset (no I, O, 0, 1).
 * @param {string} normalized — uppercase trimmed
 */
export function isValidPoolInviteCodeFormat(normalized) {
  return /^[A-HJ-NP-Z2-9]{5}$/.test(normalized);
}
