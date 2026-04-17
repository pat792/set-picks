/**
 * @typedef {'phishin' | 'phishnet'} NormalizedSetlistApiSource
 */

/**
 * @typedef {object} ParsedSetlistDto
 * @property {Record<string, string>} positionSlots Song title per `FORM_FIELDS` id (`wild` often empty — not in admin slot form).
 * @property {string[]} playedSongOrder Full show order as played (normalized titles, no empties).
 * @property {string[]} encoreSongTitles Encore segment titles in show order (empty if none).
 */

export class SetlistParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SetlistParseError';
  }
}

/**
 * @param {{ id: string }[]} formFields
 * @returns {Record<string, string>}
 */
function emptySlots(formFields) {
  /** @type {Record<string, string>} */
  const o = {};
  formFields.forEach(({ id }) => {
    o[id] = '';
  });
  return o;
}

/**
 * @param {unknown} source
 * @returns {NormalizedSetlistApiSource}
 */
export function normalizeSetlistApiSource(source) {
  const s = String(source ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (s === 'phish.in' || s === 'phishin') return 'phishin';
  if (s === 'phish.net' || s === 'phishnet') return 'phishnet';
  throw new SetlistParseError(`Unknown apiSource "${source}". Use phishin or phishnet (or phish.in / phish.net).`);
}

/**
 * @param {string} setLabel
 * @returns {{ kind: 'main' | 'encore' | 'other', order: number }}
 */
function classifySetLabel(setLabel) {
  const raw = String(setLabel ?? '').trim().toLowerCase();
  if (raw === 'e' || raw === 'encore' || raw.startsWith('encore')) {
    return { kind: 'encore', order: 1_000 };
  }
  const m = /^set\s*(\d+)$/.exec(raw);
  if (m) {
    return { kind: 'main', order: Number.parseInt(m[1], 10) };
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) {
    return { kind: 'main', order: n };
  }
  return { kind: 'other', order: 500 };
}

/**
 * @param {{ setKey: string, position: number, title: string }} a
 * @param {{ setKey: string, position: number, title: string }} b
 */
function compareRows(a, b) {
  const ca = classifySetLabel(a.setKey);
  const cb = classifySetLabel(b.setKey);
  if (ca.order !== cb.order) return ca.order - cb.order;
  return a.position - b.position;
}

/**
 * @param {unknown} rawData
 * @param {{ id: string }[]} formFields
 * @returns {ParsedSetlistDto}
 */
function parsePhishin(rawData, formFields) {
  if (!rawData || typeof rawData !== 'object') {
    throw new SetlistParseError('Phish.in payload must be an object.');
  }
  const tracks = /** @type {Record<string, unknown>} */ (rawData).tracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new SetlistParseError('Phish.in payload missing non-empty tracks array.');
  }

  /** @type {{ setKey: string, position: number, title: string }[]} */
  const rows = [];
  for (const t of tracks) {
    if (!t || typeof t !== 'object') continue;
    const rec = /** @type {Record<string, unknown>} */ (t);
    const title = typeof rec.title === 'string' ? rec.title.trim() : '';
    if (!title) continue;
    const setName = typeof rec.set_name === 'string' ? rec.set_name.trim() : '';
    const position = typeof rec.position === 'number' && Number.isFinite(rec.position) ? rec.position : 0;
    rows.push({ setKey: setName || 'unknown', position, title });
  }

  if (rows.length === 0) {
    throw new SetlistParseError('Phish.in tracks contained no titled songs.');
  }

  rows.sort(compareRows);
  const playedSongOrder = rows.map((r) => r.title);

  const bySet = new Map();
  for (const r of rows) {
    const key = r.setKey;
    if (!bySet.has(key)) bySet.set(key, []);
    bySet.get(key).push(r);
  }

  const slots = emptySlots(formFields);
  const set1Key = [...bySet.keys()].find((k) => {
    const c = classifySetLabel(k);
    return c.kind === 'main' && c.order === 1;
  });
  const set1 = set1Key != null ? bySet.get(set1Key) : undefined;
  const set2Key = [...bySet.keys()].find((k) => {
    const c = classifySetLabel(k);
    return c.kind === 'main' && c.order === 2;
  });
  const set2 = set2Key != null ? bySet.get(set2Key) : undefined;
  const encRows = [...bySet.entries()]
    .filter(([k]) => classifySetLabel(k).kind === 'encore')
    .flatMap(([, arr]) => arr)
    .sort((a, b) => a.position - b.position);

  const set1Complete = Boolean(set2?.length);
  const set2Complete = Boolean(encRows.length);
  const encoreSongTitles = encRows.map((r) => r.title).filter(Boolean);

  if (set1?.length) {
    set1.sort((a, b) => a.position - b.position);
    slots.s1o = set1[0].title;
    slots.s1c = set1Complete ? set1[set1.length - 1].title : '';
  }
  if (set2?.length) {
    set2.sort((a, b) => a.position - b.position);
    slots.s2o = set2[0].title;
    slots.s2c = set2Complete ? set2[set2.length - 1].title : '';
  }
  if (encoreSongTitles.length) {
    slots.enc = encoreSongTitles[0];
  }

  return { positionSlots: slots, playedSongOrder, encoreSongTitles };
}

/**
 * @param {unknown} rawData
 * @param {{ id: string }[]} formFields
 * @returns {ParsedSetlistDto}
 */
function parsePhishnet(rawData, formFields) {
  if (!rawData || typeof rawData !== 'object') {
    throw new SetlistParseError('Phish.net payload must be an object.');
  }
  const body = /** @type {Record<string, unknown>} */ (rawData);
  if (body.error != null && body.error !== false && body.error !== 0 && body.error !== '0') {
    throw new SetlistParseError(
      typeof body.error_message === 'string' ? body.error_message : 'Phish.net API returned an error.',
    );
  }
  const data = body.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new SetlistParseError(
      'Phish.net returned no setlist songs for this date (empty data). Often that means the show has not happened yet or Phish.net has no setlist posted—try a past show date that already occurred.'
    );
  }

  /** @type {{ setKey: string, position: number, title: string }[]} */
  const rows = [];
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const rec = /** @type {Record<string, unknown>} */ (row);
    const song = typeof rec.song === 'string' ? rec.song.trim() : '';
    if (!song) continue;
    const setRaw = rec.set;
    const setKey =
      typeof setRaw === 'string' ? setRaw.trim() : typeof setRaw === 'number' ? String(setRaw) : '';
    const position =
      typeof rec.position === 'number' && Number.isFinite(rec.position)
        ? rec.position
        : typeof rec.idx === 'number' && Number.isFinite(rec.idx)
          ? rec.idx
          : 0;
    rows.push({ setKey: setKey || 'unknown', position, title: song });
  }

  if (rows.length === 0) {
    throw new SetlistParseError('Phish.net data rows contained no songs.');
  }

  rows.sort(compareRows);
  const playedSongOrder = rows.map((r) => r.title);

  const bySet = new Map();
  for (const r of rows) {
    const key = r.setKey;
    if (!bySet.has(key)) bySet.set(key, []);
    bySet.get(key).push(r);
  }

  const slots = emptySlots(formFields);
  const set1 = bySet.get('1');
  const set2 = bySet.get('2');
  const encKeys = [...bySet.keys()].filter((k) => classifySetLabel(k).kind === 'encore');
  const encRows = encKeys.flatMap((k) => bySet.get(k) ?? []).sort((a, b) => a.position - b.position);

  const set1Complete = Boolean(set2?.length);
  const set2Complete = Boolean(encRows.length);
  const encoreSongTitles = encRows.map((r) => r.title).filter(Boolean);

  if (set1?.length) {
    set1.sort((a, b) => a.position - b.position);
    slots.s1o = set1[0].title;
    slots.s1c = set1Complete ? set1[set1.length - 1].title : '';
  }
  if (set2?.length) {
    set2.sort((a, b) => a.position - b.position);
    slots.s2o = set2[0].title;
    slots.s2c = set2Complete ? set2[set2.length - 1].title : '';
  }
  if (encoreSongTitles.length) {
    slots.enc = encoreSongTitles[0];
  }

  return { positionSlots: slots, playedSongOrder, encoreSongTitles };
}

/**
 * Parses raw setlist JSON from Phish.in or Phish.net into a role-explicit DTO.
 *
 * @param {object} rawData - Raw JSON (object) from {@link fetchSetlistRaw} `.data` on success.
 * @param {string} apiSource - `phishin` | `phishnet` (also accepts `phish.in` / `phish.net`).
 * @param {{ FORM_FIELDS: { id: string }[] }} gameConfig - Pass `{ FORM_FIELDS }` from `gameConfig.js`.
 * @returns {ParsedSetlistDto}
 * @throws {SetlistParseError} When payload shape is invalid or apiSource is unknown.
 */
export function parseSetlist(rawData, apiSource, gameConfig) {
  const fields = gameConfig?.FORM_FIELDS;
  if (!fields || !Array.isArray(fields)) {
    throw new SetlistParseError('gameConfig.FORM_FIELDS is required.');
  }
  const src = normalizeSetlistApiSource(apiSource);
  if (src === 'phishin') return parsePhishin(rawData, fields);
  return parsePhishnet(rawData, fields);
}

/**
 * Maps {@link ParsedSetlistDto} into the shapes consumed by {@link saveOfficialSetlistByDate}
 * (`setlistData` keyed by slot id, `officialSetlist` ordered strings). Does not write to Firestore.
 *
 * @param {ParsedSetlistDto} parsed
 * @param {{ id: string }[]} slotFields - e.g. `ADMIN_SETLIST_FIELDS` (excludes `wild`).
 * @returns {{ setlistData: Record<string, string>, officialSetlist: string[], encoreSongs: string[] }}
 */
export function mapParsedSetlistToLegacySaveShape(parsed, slotFields) {
  if (!parsed?.positionSlots || !Array.isArray(parsed.playedSongOrder)) {
    throw new SetlistParseError('Invalid parsed setlist DTO.');
  }
  /** @type {Record<string, string>} */
  const setlistData = {};
  slotFields.forEach(({ id }) => {
    const v = parsed.positionSlots[id];
    setlistData[id] = typeof v === 'string' ? v.trim() : '';
  });
  const officialSetlist = parsed.playedSongOrder.map((s) => String(s ?? '').trim()).filter(Boolean);
  const encoreSongs = Array.isArray(parsed.encoreSongTitles)
    ? parsed.encoreSongTitles.map((s) => String(s ?? '').trim()).filter(Boolean)
    : [];
  return { setlistData, officialSetlist, encoreSongs };
}
