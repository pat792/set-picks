import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  calculateTotalScore,
  getSlotScoreBreakdown,
} from '../../../shared/utils/scoring';

/** Matches splash / marketing copy (`SplashHeader`, `SplashAboutSection`). */
export const GRADED_PICKS_SHARE_BRAND = "Setlist Pick 'Em";

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

function tileEmoji(slot) {
  if (slot.kind === 'none' || slot.kind === 'miss') return '⬛';
  if (slot.kind === 'in_setlist') return '🟦';
  return '🟩';
}

function cellTextToken(slot) {
  const emoji = tileEmoji(slot);
  const bust = slot.bustoutBoost ? '⭐' : '';
  return `${emoji}${bust}${slot.points}`;
}

/**
 * Compact share caption: brand, show label, total, 2×3 emoji-ish grid with per-slot points.
 *
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareText({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const row1 = slots.slice(0, 3).map(cellTextToken).join('  ');
  const row2 = slots.slice(3, 6).map(cellTextToken).join('  ');
  return [
    `${GRADED_PICKS_SHARE_BRAND} · ${showLabel}`,
    `${total} pts`,
    '',
    row1,
    row2,
    '',
    '⭐ = bustout bonus',
  ].join('\n');
}

/** @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot */
function paletteForSlot(slot) {
  if (slot.kind === 'none' || slot.kind === 'miss') {
    return { fill: '#1e293b', stroke: '#64748b', text: '#e2e8f0' };
  }
  if (slot.kind === 'in_setlist') {
    return { fill: '#172554', stroke: '#3b82f6', text: '#bfdbfe' };
  }
  return { fill: '#134e4a', stroke: '#2dd4bf', text: '#ccfbf1' };
}

/**
 * Draws a 2×3 graded grid (slot order = {@link FORM_FIELDS}) to PNG.
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>} slots
 * @param {{ showLabel: string, totalPoints: number, scale?: number }} opts
 * @returns {Promise<Blob>}
 */
export function renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints, scale = 2 }) {
  const W = 640;
  const H = 400;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas 2D context unavailable'));
  }
  ctx.scale(scale, scale);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(GRADED_PICKS_SHARE_BRAND, 22, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(showLabel, 22, 58);

  const ptsLabel = `${totalPoints} pts`;
  ctx.font = 'bold 16px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#2dd4bf';
  const ptsW = ctx.measureText(ptsLabel).width;
  ctx.fillText(ptsLabel, W - 22 - ptsW, 40);

  const padX = 20;
  const padY = 78;
  const gap = 12;
  const cellW = (W - padX * 2 - gap * 2) / 3;
  const cellH = (H - padY - 20 - gap) / 2;
  const r = 10;

  slots.forEach((slot, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = padX + col * (cellW + gap);
    const y = padY + row * (cellH + gap);
    const { fill, stroke, text } = paletteForSlot(slot);
    const bust = slot.bustoutBoost;

    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = bust ? 3.5 : 2;
    ctx.strokeStyle = bust ? '#f59e0b' : stroke;
    ctx.stroke();

    ctx.fillStyle = text;
    ctx.font = 'bold 28px Inter, system-ui, -apple-system, sans-serif';
    const ptsStr = String(slot.points);
    const tw = ctx.measureText(ptsStr).width;
    ctx.fillText(ptsStr, x + (cellW - tw) / 2, y + cellH / 2 + 10);

    if (bust) {
      ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Bustout', x + 8, y + 18);
    }
  });

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
