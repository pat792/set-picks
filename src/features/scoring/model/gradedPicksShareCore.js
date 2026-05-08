import { FORM_FIELDS, SHARE_RECAP_ARTIST_NAME } from '../../../shared/data/gameConfig';
import {
  calculateTotalScore,
  getSlotScoreBreakdown,
} from '../../../shared/utils/scoring';

/** Matches splash / marketing copy (`SplashHeader`, `SplashAboutSection`). */
export const GRADED_PICKS_SHARE_BRAND = "Setlist Pick 'Em";

/** Web Share API `title` + first line when copying full plain text. */
export const GRADED_PICKS_SHARE_RECAP_TITLE = "My Setlist Pick 'Em Recap";

/** Canonical marketing URL (see `InstallAppCard`, Firebase auth notes). */
export const GRADED_PICKS_SHARE_SITE_URL = 'https://www.setlistpickem.com/';

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
 * Opaque fills — PNG card (and any raster preview) reads clearly everywhere.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot
 */
/**
 * Colored block + points + optional BB (plain-text / SMS friendly).
 * Uses large colored squares (not custom icons — plain text cannot embed SVG).
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot
 * @param {Record<string, unknown>} userPicks
 */
function shareEmojiCellToken(slot, userPicks) {
  const raw = userPicks?.[slot.fieldId];
  const hasPick = raw != null && String(raw).trim() !== '';
  let block = '⬛';
  if (hasPick) {
    if (slot.kind === 'miss' || slot.kind === 'none') block = '⬛';
    else if (slot.kind === 'in_setlist') block = '🟦';
    else block = '🟩';
  }
  const bust = slot.bustoutBoost ? ' BB' : '';
  return `${block}${slot.points}${bust}`;
}

/**
 * Two rows × three columns, padded for monospace alignment.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>} slots
 * @param {Record<string, unknown>} userPicks
 */
export function buildGradedPicksShareEmojiGrid(slots, userPicks) {
  const cells = slots.map((s) => shareEmojiCellToken(s, userPicks));
  const w = Math.max(...cells.map((c) => c.length), 5);
  const pad = (c) => c.padEnd(w, ' ');
  return `${pad(cells[0])} ${pad(cells[1])} ${pad(cells[2])}\n${pad(cells[3])} ${pad(cells[4])} ${pad(cells[5])}`;
}

function paletteForSlot(slot) {
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
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareBodyPlain({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const grid = buildGradedPicksShareEmojiGrid(slots, userPicks);
  return [
    `${SHARE_RECAP_ARTIST_NAME} · ${showLabel}`,
    `Total: ${total} pts`,
    '',
    grid,
    '',
    '🟩 strong pick · 🟦 in setlist · ⬛ miss or empty · BB = Bustout Boost™',
    '',
    'Free setlist game:',
    GRADED_PICKS_SHARE_SITE_URL,
  ].join('\n');
}

/**
 * Full plain text for clipboard fallback (headline once, then succinct body).
 */
export function buildGradedPicksShareFullPlainText(args) {
  return [GRADED_PICKS_SHARE_RECAP_TITLE, '', buildGradedPicksShareBodyPlain(args)].join('\n');
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
 * @param {CanvasRenderingContext2D} ctx
 */
function drawBoostPill(ctx, x, y, w) {
  const pillH = 17;
  const pillR = pillH / 2;
  const label = 'Bustout Boost™';
  ctx.font = '600 8.5px Inter, system-ui, -apple-system, sans-serif';
  const tw = ctx.measureText(label).width;
  const pillW = Math.min(w - 10, tw + 14);
  const px = x + (w - pillW) / 2;
  ctx.beginPath();
  ctx.roundRect(px, y, pillW, pillH, pillR);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgb(251, 191, 36)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, px + pillW / 2, y + pillH / 2);
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
    const bust = slot.bustoutBoost;
    const borderW = bust ? 2.5 : 1.75;

    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, cornerR);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + borderW, y + borderW, cellW - borderW * 2, cellH - borderW * 2, Math.max(4, cornerR - borderW));
    ctx.clip();

    const innerPad = 10;
    let contentTop = y + innerPad;
    if (bust) {
      drawBoostPill(ctx, x, contentTop, cellW);
      contentTop += 22;
    }

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
    ctx.strokeStyle = bust ? '#f59e0b' : stroke;
    ctx.lineWidth = borderW;
    ctx.stroke();
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.font = '9px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('Amber frame = Bustout Boost™ on that slot.', W / 2, H - 32);
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
