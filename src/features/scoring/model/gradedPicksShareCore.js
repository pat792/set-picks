import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  calculateTotalScore,
  getSlotScoreBreakdown,
} from '../../../shared/utils/scoring';

/** Matches splash / marketing copy (`SplashHeader`, `SplashAboutSection`). */
export const GRADED_PICKS_SHARE_BRAND = "Setlist Pick 'Em";

/** Web Share API title + recap headline (plain language). */
export const GRADED_PICKS_SHARE_RECAP_TITLE = "My Setlist Pick 'Em Recap";

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
 * Single-letter slot tier for plain-text share (no emoji — SMS/social safe).
 * @param {string} kind
 * @param {boolean} hasPick
 */
export function shareTextKindLetter(kind, hasPick) {
  if (!hasPick) return '—';
  switch (kind) {
    case 'exact_slot':
      return 'X';
    case 'encore_exact':
      return 'E';
    case 'wildcard_hit':
      return 'W';
    case 'in_setlist':
      return 'I';
    case 'miss':
      return 'M';
    default:
      return '—';
  }
}

function formatShareTextCell(slot, userPicks) {
  const raw = userPicks?.[slot.fieldId];
  const hasPick = raw != null && String(raw).trim() !== '';
  const letter = shareTextKindLetter(slot.kind, hasPick);
  const bust = slot.bustoutBoost ? ' BB' : '';
  return `${letter}${slot.points}${bust}`;
}

function padShareCells(cells, cellWidth) {
  return cells.map((c) => c.padEnd(cellWidth, ' '));
}

/**
 * Compact share caption: recap title, brand, show, total, 2×3 letter grid + legend (no emoji).
 *
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareText({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const cells = slots.map((s) => formatShareTextCell(s, userPicks));
  const cellW = Math.max(...cells.map((c) => c.length), 6);
  const [a, b, c, d, e, f] = padShareCells(cells, cellW);
  const row1 = `${a} ${b} ${c}`;
  const row2 = `${d} ${e} ${f}`;
  return [
    GRADED_PICKS_SHARE_RECAP_TITLE,
    `${GRADED_PICKS_SHARE_BRAND} · ${showLabel}`,
    `Total: ${total} pts`,
    '',
    row1,
    row2,
    '',
    'X=Exact slot · E=Encore exact · W=Wildcard · I=In setlist · M=Miss · —=No pick',
    'BB=Bustout Boost™',
  ].join('\n');
}

/** @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot */
function paletteForSlot(slot) {
  if (slot.kind === 'none' || slot.kind === 'miss') {
    return {
      fill: 'rgba(30, 41, 59, 0.95)',
      stroke: 'rgba(100, 116, 139, 0.55)',
      text: 'rgb(148, 163, 184)',
    };
  }
  if (slot.kind === 'in_setlist') {
    return {
      fill: 'rgba(59, 130, 246, 0.12)',
      stroke: 'rgba(59, 130, 246, 0.5)',
      text: 'rgb(147, 197, 253)',
    };
  }
  return {
    fill: 'rgba(45, 212, 191, 0.12)',
    stroke: 'rgba(45, 212, 191, 0.5)',
    text: 'rgb(204, 251, 241)',
  };
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
 * Layout matches in-app breakdown: rounded-xl tiles, points centered in cell.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>} slots
 * @param {{ showLabel: string, totalPoints: number, scale?: number }} opts
 * @returns {Promise<Blob>}
 */
export function renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints, scale = 2 }) {
  const W = 640;
  const H = 420;

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
  ctx.fillText(`${GRADED_PICKS_SHARE_BRAND} · ${showLabel}`, 22, 54);

  const ptsLabel = `${totalPoints} pts`;
  ctx.font = 'bold 15px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgb(45, 212, 191)';
  const ptsW = ctx.measureText(ptsLabel).width;
  ctx.textAlign = 'right';
  ctx.fillText(ptsLabel, W - 22, 36);
  ctx.textAlign = 'left';

  const padX = 20;
  const padTop = 72;
  const footerH = 28;
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
    ctx.strokeStyle = bust ? 'rgba(245, 158, 11, 0.55)' : stroke;
    ctx.lineWidth = borderW;
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
  ctx.font = '10px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Amber frame = Bustout Boost™ on that slot.', W / 2, H - 12);

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
