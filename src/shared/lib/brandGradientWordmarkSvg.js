import raw from '../../../public/branding/splash-gradient-4x1.svg?raw';

/**
 * Build-time markup for `public/branding/splash-gradient-4x1.svg` (same URL as
 * {@link BRAND_GRADIENT_WORDMARK_SRC} in `shared/config/branding.js`).
 *
 * `<img src=".svg">` is often rasterized on mobile WebKit; inlining keeps vectors crisp.
 */

const SVG_CRISP_ATTRS =
  'focusable="false" aria-hidden="true" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"';

export function getBrandHeroWordmarkSvgMarkup() {
  return raw
    .replace(
      /^<svg\s/i,
      `<svg ${SVG_CRISP_ATTRS} class="block h-full w-full min-h-0" `,
    )
    .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMin slice"');
}

/** Chrome bars: uniform scale via height; keep `meet` like `object-contain`. */
export function getBrandChromeWordmarkSvgMarkup() {
  return raw.replace(
    /^<svg\s/i,
    `<svg ${SVG_CRISP_ATTRS} class="block h-full w-auto max-h-full max-w-full shrink-0" `,
  );
}
