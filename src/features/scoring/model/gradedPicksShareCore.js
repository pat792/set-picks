import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  calculateTotalScore,
  getSlotScoreBreakdown,
  SCORE_BREAKDOWN_KIND_LABEL,
} from '../../../shared/utils/scoring';

/** Matches splash / marketing copy (`SplashHeader`, `SplashAboutSection`). */
export const GRADED_PICKS_SHARE_BRAND = "Setlist Pick 'Em";

/** Web Share API `title` + first line when copying full plain text. */
export const GRADED_PICKS_SHARE_RECAP_TITLE = "My Setlist Pick 'Em Recap";

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
 * Opaque fills so PNG + HTML paste read clearly on dark canvas and on white
 * rich-text targets (translucent rgba on white looked like blank white tiles).
 *
 * @param {ReturnType<typeof buildGradedPicksShareSlots>[number]} slot
 */
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
 * Monochrome “block” row for plain-text clients (█ strong · ▓ in-setlist · ░ miss / empty).
 * Not emoji; Unicode block elements.
 */
export function buildGradedPicksShareBlockRow(slots, userPicks) {
  const ch = (slot) => {
    const raw = userPicks?.[slot.fieldId];
    const hasPick = raw != null && String(raw).trim() !== '';
    if (!hasPick) return '░';
    if (slot.kind === 'miss' || slot.kind === 'none') return '░';
    if (slot.kind === 'in_setlist') return '▓';
    return '█';
  };
  return `${ch(slots[0])}${ch(slots[1])}${ch(slots[2])}\n${ch(slots[3])}${ch(slots[4])}${ch(slots[5])}`;
}

function slotReadableLine(field, slot, userPicks) {
  const raw = userPicks?.[field.id];
  const hasPick = raw != null && String(raw).trim() !== '';
  const kindLabel = hasPick ? SCORE_BREAKDOWN_KIND_LABEL[slot.kind] || '—' : 'No pick';
  const bb = slot.bustoutBoost ? ' · Bustout Boost™' : '';
  return `${field.label}: ${slot.points} pts — ${kindLabel}${bb}`;
}

/**
 * Readable recap body (no top headline). Safe to pair with `navigator.share({ title })`
 * so clients do not concatenate two identical titles.
 *
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareBodyPlain({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const lines = [
    `${GRADED_PICKS_SHARE_BRAND} · ${showLabel}`,
    `Total: ${total} pts`,
    '',
  ];
  FORM_FIELDS.forEach((field, i) => {
    const slot = slots[i];
    lines.push(slotReadableLine(field, slot, userPicks));
  });
  lines.push('');
  lines.push(buildGradedPicksShareBlockRow(slots, userPicks));
  lines.push('█ hit · ▓ in setlist · ░ miss or empty');
  lines.push('');
  lines.push('Tip: Use Download PNG for the full color card everywhere; Copy recap adds color in Mail/Notes/Slack when rich paste is supported.');
  return lines.join('\n');
}

/**
 * Full plain text for clipboard fallback (headline once, then body).
 */
export function buildGradedPicksShareFullPlainText(args) {
  return [GRADED_PICKS_SHARE_RECAP_TITLE, '', buildGradedPicksShareBodyPlain(args)].join('\n');
}

/** @deprecated Prefer {@link buildGradedPicksShareFullPlainText}; alias for older imports. */
export function buildGradedPicksShareText(args) {
  return buildGradedPicksShareFullPlainText(args);
}

/**
 * Minimal HTML for rich clipboard / some mail clients — colored 2×3 grid, no Lucide (not possible in HTML string).
 *
 * @param {{ userPicks: Record<string, unknown>, actualSetlist: unknown, showLabel: string }} args
 */
export function buildGradedPicksShareHtml({ userPicks, actualSetlist, showLabel }) {
  const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
  const total = calculateTotalScore(userPicks, actualSetlist);
  const esc = escapeHtml(showLabel);

  /**
   * Inner div carries fill (many clients strip td backgrounds); bgcolor on td is a fallback.
   */
  function tdHtml(slot) {
    const { fill, stroke, text } = paletteForSlot(slot);
    const bust = slot.bustoutBoost;
    const borderColor = bust ? '#f59e0b' : stroke;
    const borderW = bust ? '3px' : '2px';
    const boost = bust
      ? '<div style="font-size:8px;font-weight:700;color:#fbbf24;margin:0 0 4px 0;line-height:1.2;">Bustout Boost™</div>'
      : '';
    const inner = `<div style="background-color:${fill};border:${borderW} solid ${borderColor};border-radius:14px;padding:10px 6px 12px 6px;text-align:center;min-height:52px;">
      ${boost}<div style="font-weight:800;font-size:22px;font-family:Arial,Helvetica,sans-serif;color:${text};line-height:1.15;">${slot.points}</div>
    </div>`;
    return `<td width="33%" bgcolor="#0f172a" style="padding:6px;background-color:#0f172a;vertical-align:top;border:none;">${inner}</td>`;
  }

  const row1 = `<tr>${tdHtml(slots[0])}${tdHtml(slots[1])}${tdHtml(slots[2])}</tr>`;
  const row2 = `<tr>${tdHtml(slots[3])}${tdHtml(slots[4])}${tdHtml(slots[5])}</tr>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body bgcolor="#0f172a" style="margin:0;background-color:#0f172a;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;padding:16px;">
<div bgcolor="#0f172a" style="max-width:360px;background-color:#0f172a;">
  <div style="font-weight:800;font-size:17px;margin-bottom:6px;color:#f8fafc;">${escapeHtml(GRADED_PICKS_SHARE_RECAP_TITLE)}</div>
  <div style="color:#94a3b8;font-size:12px;margin-bottom:4px;">${escapeHtml(GRADED_PICKS_SHARE_BRAND)} · ${esc}</div>
  <div style="font-weight:700;color:#2dd4bf;font-size:14px;margin-bottom:12px;">${total} pts</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0f172a" style="width:100%;border-collapse:separate;border-spacing:10px;background-color:#0f172a;">${row1}${row2}</table>
  <p style="color:#94a3b8;font-size:10px;margin-top:12px;line-height:1.4;">Amber frame = Bustout Boost™ on that slot.</p>
</div>
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
    ctx.strokeStyle = bust ? '#f59e0b' : stroke;
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
