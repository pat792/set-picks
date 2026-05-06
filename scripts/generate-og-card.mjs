/**
 * Builds `public/branding/og-card-1200x630.png` from existing splash SVGs.
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

const gradientSvg = await readFile(path.join(root, 'public/branding/splash-gradient-4x1.svg'));
const wordmarkSvg = await readFile(path.join(root, 'public/branding/splash-wordmark.svg'));

const bg = await sharp(gradientSvg).resize(W, H, { fit: 'cover' }).png().toBuffer();

const wmWidth = Math.round(W * 0.58);
const wmBuf = await sharp(wordmarkSvg)
  .resize(wmWidth, null, { fit: 'inside' })
  .png()
  .toBuffer();

await sharp(bg).composite([{ input: wmBuf, gravity: 'center' }]).png().toFile(OUT);

console.log('Wrote', path.relative(root, OUT));
