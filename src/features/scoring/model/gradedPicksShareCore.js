import { FORM_FIELDS, SHARE_RECAP_ARTIST_NAME } from '../../../shared/data/gameConfig';
import {
  calculateTotalScore,
  getSlotScoreBreakdown,
} from '../../../shared/utils/scoring';

/** Matches splash / marketing copy (`SplashHeader`, `SplashAboutSection`). */
export const GRADED_PICKS_SHARE_BRAND = "Setlist Pick 'Em";

/** Web Share API `title` (brief brand for OS share sheet chrome). */
export const GRADED_PICKS_SHARE_RECAP_TITLE = "Setlist Pick 'Em";

/** Conversational opener that contextualizes the grid for recipients. */
export const GRADED_PICKS_SHARE_INTRO = "Check out my Setlist Pick 'Em score!";

/** Canonical marketing URL (see `InstallAppCard`, Firebase auth notes). */
export const GRADED_PICKS_SHARE_SITE_URL = 'https://www.setlistpickem.com/';

/** Bare domain for plain-text CTA; auto-links on iOS, Android, WhatsApp, etc. */
export const GRADED_PICKS_SHARE_DOMAIN = 'setlistpickem.com';

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Record<string, unknown>} userPicks
 * @param {unknown} actualSetlist
 * @returns {Array<{ fieldId: string, label: string, points: number, bustoutBoost: boolean, kind: string }>}
 */
export function buildGradedPicksShareSlots(userPicks, actualSetlist) {
  return FORM_FIELDS.map((field) => {
    if (!actualSetlist || !userPicks) {
      return {
        fieldId: field.id,
        label: field.label,
        points: 0,
        bustoutBoost: false,
        kind: /** @type {const} */ ('none'),
      };
    }
    const { points, bustoutBoost, kind } = getSlotScoreBreakdown(
      field.id,
      userPicks[field.id],
      actualSetlist
    );
    return { fieldId: field.id, label: field.label, points, bustoutBoost, kind };
  });
}

/**
 * One colored square per slot (no digits). Bustout = 🟧 (amber); yellow 🟨 is
 * reserved if we ever need a second warm tone — plain text cannot pick per-font.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot
 * @param {Record<string, unknown>} userPicks
 */
function shareEmojiCellChar(slot, userPicks) {
  const raw = userPicks?.[slot.fieldId];
  const hasPick = raw != null && String(raw).trim() !== '';
  if (!hasPick) return '⬛';
  if (slot.bustoutBoost) return '🟧';
  if (slot.kind === 'miss' || slot.kind === 'none') return '⬛';
  if (slot.kind === 'in_setlist') return '🟦';
  return '🟩';
}

/**
 * Two rows × three columns, no inter-tile spacing. Tight grid matches Wordle
 * convention and eliminates cross-platform alignment issues caused by variable
 * emoji+space width rendering (especially iOS Messages / iMessage).
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>} slots
 * @param {Record<string, unknown>} userPicks
 */
export function buildGradedPicksShareEmojiGrid(slots, userPicks) {
  const ch = (s) => shareEmojiCellChar(s, userPicks);
  return `${ch(slots[0])}${ch(slots[1])}${ch(slots[2])}\n${ch(slots[3])}${ch(slots[4])}${ch(slots[5])}`;
}

/** Opaque fills for PNG tiles (bust = full amber tile, same idea as emoji 🟧). */
function paletteForSlot(slot) {
  if (slot.bustoutBoost) {
    return {
      fill: '#713f12',
      stroke: '#fbbf24',
      text: '#fef3c7',
    };
  }
  if (slot.kind === 'none' || slot.kind === 'miss') {
    return {
      fill: '#1e293b',
      stroke: '#64748b',
      text: '#94a3b8',
    };
  }
  if (slot.kind === 'in_setlist') {
    return {
      fill: '#172554',
      stroke: '#3b82f6',
      text: '#93c5fd',
    };
  }
  return {
    fill: '#134e4a',
    stroke: '#2dd4bf',
    text: '#ccfbf1',
  };
}

/**
 * Succinct body for SMS / Web Share `text` (no per-slot prose). Pair with
 * `title: GRADED_PICKS_SHARE_RECAP_TITLE` so clients do not duplicate the headline.
 *
 * Optimized for two audiences:
 * - Sender: compact, visually clean → lowers friction to share.
 * - Recipient (non-user): curiosity via grid + score, minimal legend, clear
 *   action-oriented CTA with bare domain (auto-links on all major platforms).
 *
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareBodyPlain({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const grid = buildGradedPicksShareEmojiGrid(slots, userPicks);
  return [
    GRADED_PICKS_SHARE_INTRO,
    `${SHARE_RECAP_ARTIST_NAME} · ${showLabel} · ${total} pts`,
    '',
    grid,
    '',
    '🟩 nailed it · 🟦 in setlist · ⬛ miss · 🟧 bustout bonus',
    '',
    `Play free → ${GRADED_PICKS_SHARE_DOMAIN}`,
  ].join('\n');
}

/**
 * Full plain text for clipboard copy. Now identical to body since the intro
 * line is embedded in the body itself.
 */
export function buildGradedPicksShareFullPlainText(args) {
  return buildGradedPicksShareBodyPlain(args);
}

/** @deprecated Prefer {@link buildGradedPicksShareFullPlainText}; alias for older imports. */
export function buildGradedPicksShareText(args) {
  return buildGradedPicksShareFullPlainText(args);
}

/**
 * Rich clipboard: embedded PNG (data URL) so colors survive Mail/Notes/Slack,
 * plus a short CTA link. `imageDataUrl` must be `data:image/png;base64,...`.
 *
 * @param {{ imageDataUrl: string, showLabel: string, totalPoints: number }} args
 */
export function buildGradedPicksShareClipboardHtml({ imageDataUrl, showLabel, totalPoints }) {
  const esc = escapeHtml(showLabel);
  const artistEsc = escapeHtml(SHARE_RECAP_ARTIST_NAME);
  const alt = escapeHtml(`${GRADED_PICKS_SHARE_RECAP_TITLE} — ${showLabel}`);
  const href = escapeHtml(GRADED_PICKS_SHARE_SITE_URL);
  const host = 'setlistpickem.com';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body bgcolor="#0f172a" style="margin:0;padding:16px;background-color:#0f172a;text-align:center;font-family:Arial,Helvetica,sans-serif;">
  <img src="${imageDataUrl}" alt="${alt}" width="320" style="max-width:100%;height:auto;display:block;margin:0 auto 12px auto;border-radius:12px;" />
  <p style="color:#94a3b8;font-size:13px;margin:0 0 10px;line-height:1.4;">${artistEsc} · ${esc}<br/><span style="color:#2dd4bf;font-weight:700;">${totalPoints} pts</span></p>
  <p style="margin:0;font-size:14px;"><a href="${href}" style="color:#2dd4bf;font-weight:800;">Play free · ${host} →</a></p>
</body></html>`;
}

/**
 * Draws a 2×3 graded grid (slot order = {@link FORM_FIELDS}) to PNG.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>} slots
 * @param {{ showLabel: string, totalPoints: number, scale?: number }} opts
 * @returns {Promise<Blob>}
 */
export function renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints, scale = 2, artistName = SHARE_RECAP_ARTIST_NAME }) {
  const W = 640;
  const H = 440;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas 2D context unavailable'));
  }
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgb(15, 23, 42)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 19px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(GRADED_PICKS_SHARE_RECAP_TITLE, 22, 34);

  ctx.fillStyle = 'rgb(148, 163, 184)';
  ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(`${artistName} · ${showLabel}`, 22, 54);

  const ptsLabel = `${totalPoints} pts`;
  ctx.font = 'bold 15px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgb(45, 212, 191)';
  const ptsW = ctx.measureText(ptsLabel).width;
  ctx.textAlign = 'right';
  ctx.fillText(ptsLabel, W - 22, 36);
  ctx.textAlign = 'left';

  const padX = 20;
  const padTop = 72;
  const footerH = 48;
  const gap = 12;
  const rowGap = 12;
  const cellW = (W - padX * 2 - gap * 2) / 3;
  const cellH = (H - padTop - footerH - rowGap) / 2;
  const cornerR = 14;

  slots.forEach((slot, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = padX + col * (cellW + gap);
    const y = padTop + row * (cellH + rowGap);
    const { fill, stroke, text } = paletteForSlot(slot);
    const borderW = 1.75;

    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, cornerR);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + borderW, y + borderW, cellW - borderW * 2, cellH - borderW * 2, Math.max(4, cornerR - borderW));
    ctx.clip();

    const innerPad = 10;
    const contentTop = y + innerPad;
    const contentBottom = y + cellH - innerPad;
    const centerY = (contentTop + contentBottom) / 2;
    const mainSize = Math.min(32, Math.max(20, cellH * 0.38));

    ctx.fillStyle = text;
    ctx.font = `800 ${mainSize}px Inter, system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ptsStr = String(slot.points);
    ctx.fillText(ptsStr, x + cellW / 2, centerY);

    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, cornerR);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = borderW;
    ctx.stroke();
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.font = '9px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('Amber tile = Bustout Boost™ on that slot.', W / 2, H - 32);
  ctx.fillStyle = 'rgb(45, 212, 191)';
  ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('setlistpickem.com · Free to play', W / 2, H - 12);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG export failed'));
      },
      'image/png',
      1
    );
  });
}
