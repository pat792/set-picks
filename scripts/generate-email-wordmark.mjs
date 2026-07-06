/**
 * Rasterize `public/branding/email-gradient-wordmark.svg` → PNG for email clients.
 * SVG `<img>` is unreliable in Gmail and the new path 404s until the SPA deploys;
 * inline-ready PNG is copied to `comms/` (Functions bundle) and `public/branding/`.
 *
 * Run after changing the SVG: `npm run generate:email-wordmark`
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public/branding/email-gradient-wordmark.svg');
const targets = [
  path.join(root, 'public/branding/email-gradient-wordmark.png'),
  path.join(root, 'comms/email-gradient-wordmark.png'),
];

const svg = await readFile(svgPath);
const png = await sharp(svg, { density: 300 }).resize({ width: 800 }).png().toBuffer();

for (const out of targets) {
  await writeFile(out, png);
  const meta = await sharp(png).metadata();
  console.log(`✓ ${path.relative(root, out)} (${meta.width}x${meta.height})`);
}
