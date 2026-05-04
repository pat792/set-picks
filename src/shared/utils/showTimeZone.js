const DEFAULT_SHOW_TIME_ZONE = 'America/Los_Angeles';

const US_STATE_TIME_ZONES = {
  AL: 'America/Chicago',
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  AR: 'America/Chicago',
  CA: 'America/Los_Angeles',
  CO: 'America/Denver',
  CT: 'America/New_York',
  DE: 'America/New_York',
  FL: 'America/New_York',
  GA: 'America/New_York',
  HI: 'Pacific/Honolulu',
  IA: 'America/Chicago',
  ID: 'America/Denver',
  IL: 'America/Chicago',
  IN: 'America/Indiana/Indianapolis',
  KS: 'America/Chicago',
  KY: 'America/New_York',
  LA: 'America/Chicago',
  MA: 'America/New_York',
  MD: 'America/New_York',
  ME: 'America/New_York',
  MI: 'America/Detroit',
  MN: 'America/Chicago',
  MO: 'America/Chicago',
  MS: 'America/Chicago',
  MT: 'America/Denver',
  NC: 'America/New_York',
  ND: 'America/Chicago',
  NE: 'America/Chicago',
  NH: 'America/New_York',
  NJ: 'America/New_York',
  NM: 'America/Denver',
  NV: 'America/Los_Angeles',
  NY: 'America/New_York',
  OH: 'America/New_York',
  OK: 'America/Chicago',
  OR: 'America/Los_Angeles',
  PA: 'America/New_York',
  RI: 'America/New_York',
  SC: 'America/New_York',
  SD: 'America/Chicago',
  TN: 'America/Chicago',
  TX: 'America/Chicago',
  UT: 'America/Denver',
  VA: 'America/New_York',
  VT: 'America/New_York',
  WA: 'America/Los_Angeles',
  WI: 'America/Chicago',
  WV: 'America/New_York',
  WY: 'America/Denver',
  DC: 'America/New_York',
};

const CANADA_PROVINCE_TIME_ZONES = {
  AB: 'America/Edmonton',
  BC: 'America/Vancouver',
  MB: 'America/Winnipeg',
  NB: 'America/Moncton',
  NL: 'America/St_Johns',
  NS: 'America/Halifax',
  NT: 'America/Yellowknife',
  NU: 'America/Iqaluit',
  ON: 'America/Toronto',
  PE: 'America/Halifax',
  QC: 'America/Toronto',
  SK: 'America/Regina',
  YT: 'America/Whitehorse',
};

function compactToken(value) {
  return String(value ?? '').trim().toUpperCase();
}

function inferZoneFromVenueLine(venueLine) {
  const parts = String(venueLine ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const tail = compactToken(parts[parts.length - 1]);
  if (US_STATE_TIME_ZONES[tail]) return US_STATE_TIME_ZONES[tail];
  if (CANADA_PROVINCE_TIME_ZONES[tail]) return CANADA_PROVINCE_TIME_ZONES[tail];

  const merged = parts.join(' ').toLowerCase();
  if (/\bcancun\b|\bmexico\b|\bquintana roo\b/.test(merged)) {
    return 'America/Cancun';
  }
  if (/\blondon\b|\bengland\b|\buk\b|\bunited kingdom\b/.test(merged)) {
    return 'Europe/London';
  }
  return null;
}

/**
 * Resolve a show's IANA timezone from explicit data first, then venue fallback.
 * @param {{ timeZone?: string, timezone?: string, venue?: string } | null | undefined} show
 * @param {string} [fallback]
 */
export function resolveShowTimeZone(show, fallback = DEFAULT_SHOW_TIME_ZONE) {
  const explicit =
    typeof show?.timeZone === 'string'
      ? show.timeZone.trim()
      : typeof show?.timezone === 'string'
        ? show.timezone.trim()
        : '';
  if (explicit) return explicit;
  return inferZoneFromVenueLine(show?.venue) || fallback;
}

export { DEFAULT_SHOW_TIME_ZONE };
