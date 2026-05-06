/**
 * Builds `public/branding/og-card-1200x630.png` for Open Graph / Twitter cards.
 *
 * Note: `splash-gradient-4x1.svg` already bakes the gradient *through* the wordmark mask;
 * compositing `splash-wordmark.svg` on top would double the logo. This script uses a
 * separate full-bleed gradient plus the white wordmark only.
 *
 * Run after changing brand artwork: `npm run generate:og-card`
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const OUT = path.join(root, 'public/branding/og-card-1200x630.png');
const W = 1200;
const H = 630;

/** Full-bleed gradient only (no typography) — tuned to match splash energy (rose → violet → sky). */
const BACKGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ogbg" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#be123c"/>
      <stop offset="42%" stop-color="#6d28d9"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ogbg)"/>
</svg>`;

const wordmarkSvg = await readFile(path.join(root, 'public/branding/splash-wordmark.svg'));

const bg = await sharp(Buffer.from(BACKGROUND_SVG)).png().toBuffer();

const wmWidth = Math.round(W * 0.58);
/** High `density` + 2× raster then downscale reduces librsvg/sharp SVG fringe (“ghost” doubles). */
const wmRaster = await sharp(wordmarkSvg, { density: 384 })
  .resize(Math.round(wmWidth * 2), null, { fit: 'inside' })
  .png()
  .toBuffer();
const wmBuf = await sharp(wmRaster)
  .resize(wmWidth, null, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();

await sharp(bg)
  .composite([{ input: wmBuf, gravity: 'center', blend: 'over' }])
  .png()
  .toFile(OUT);

console.log('Wrote', path.relative(root, OUT));
