import raw from '../../../../public/branding/splash-gradient-4x1.svg?raw';

/**
 * Build-time string of the primary gradient lockup (same file as `/branding/splash-gradient-4x1.svg`).
 */
export function getSplashHeroWordmarkSvgMarkup() {
  return raw
    .replace(
      /^<svg\s/i,
      '<svg focusable="false" aria-hidden="true" class="block h-full w-full min-h-0" ',
    )
    .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMin slice"');
}
