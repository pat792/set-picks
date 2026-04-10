/**
 * Primary gradient lockup (cropped viewBox). Used for splash hero, splash header, and dashboard brand.
 * White-only variant: `splash-wordmark.svg` (not wired by default).
 */
export const BRAND_GRADIENT_WORDMARK_SRC = '/branding/splash-gradient-4x1.svg';

export const BRAND_WORDMARK_SRC = BRAND_GRADIENT_WORDMARK_SRC;
export const BRAND_HERO_WORDMARK_SRC = BRAND_GRADIENT_WORDMARK_SRC;

/**
 * Hero frame: the SVG’s painted gradient is taller than the letterforms, leaving a band of empty
 * space below the artwork. A wider aspect + overflow clips that band; the img uses `object-cover`
 * + `object-top` inside this frame only.
 */
export const brandHeroWordmarkAspectFrameClassNames =
  'mx-auto block aspect-[16/5] w-[100vw] max-w-none overflow-hidden sm:aspect-[71/20] sm:w-full sm:max-w-[min(96vw,70rem)] md:max-w-[min(94vw,78rem)] lg:max-w-[min(92vw,86rem)] xl:max-w-[min(90vw,94rem)]';

/** Fills {@link brandHeroWordmarkAspectFrameClassNames}; do not use without that frame. */
export const brandHeroWordmarkImgClassNames =
  'block h-full w-full min-h-0 object-cover object-top drop-shadow-[0_4px_32px_rgba(15,10,46,0.5)]';

/** Mobile scale on top of cropped SVG (viewBox trim already boosts height vs old 300×75 artboard). */
export const brandHeroWordmarkScaleWrapperClassNames =
  'block w-full origin-center scale-[1.2] motion-reduce:scale-100 sm:scale-100';

/**
 * Per-surface img `className` tokens. Contexts differ in bar height and horizontal budget,
 * so reuse the same file with different constraints (do not rely on one global size).
 */
export const brandWordmarkImgClassNames = {
  /**
   * Fixed splash header (`h-16` / `h-20` bar). Wide gradient lockup: height-led + `max-w` so CTAs fit.
   */
  splashHeader:
    'block h-[3.95rem] w-auto max-w-[calc(100vw_-_8.5rem)] object-contain object-left sm:h-[3.85rem] sm:max-w-[min(54vw,360px)]',
  /**
   * Desktop sidebar: width-led (`w-full h-auto`) so the ~2.5:1 crop uses the full column; fixed
   * height + object-contain was capping width and made the lockup tiny vs nav labels.
   */
  dashboardSidebar:
    'block h-auto w-full max-w-full object-contain object-center md:max-h-[11.5rem]',
  /**
   * Post-login mobile bar: taller base + stronger scale than splash so it reads vs `text-sm` titles
   * and the 32px avatar.
   */
  dashboardMobileBar:
    'block h-[3.95rem] w-auto max-w-[calc(100vw_-_7rem)] object-contain object-left sm:h-[4.05rem] sm:max-w-[min(68vw,380px)]',
};

/** Splash header: slight scale so gradient lockup matches nav text weight without widening the bar. */
export const brandWordmarkSplashHeaderScaleWrapperClassNames =
  'inline-block origin-left scale-[1.28] motion-reduce:scale-100 sm:scale-[1.18]';

/**
 * Post-login mobile: stronger scale than splash so the wordmark matches page hierarchy in a short bar.
 */
export const brandWordmarkDashboardMobileBarScaleWrapperClassNames =
  'inline-block origin-left scale-[1.34] motion-reduce:scale-100 sm:scale-[1.22]';

/**
 * Sidebar: `md:flex` + `origin-center` + `object-center` on the img centers the lockup in `w-64`;
 * scale boosts height vs nav labels.
 */
export const brandWordmarkDashboardSidebarScaleWrapperClassNames =
  'block w-full max-w-full origin-left scale-[1.02] motion-reduce:scale-100 md:flex md:origin-center md:justify-center md:scale-[1.38]';
