/**
 * Primary gradient lockup (cropped viewBox). Used for splash hero, splash header, and dashboard brand.
 * White-only variant: `splash-wordmark.svg` (not wired by default).
 */
export const BRAND_GRADIENT_WORDMARK_SRC = '/branding/splash-gradient-4x1.svg';

export const BRAND_WORDMARK_SRC = BRAND_GRADIENT_WORDMARK_SRC;
export const BRAND_HERO_WORDMARK_SRC = BRAND_GRADIENT_WORDMARK_SRC;

/**
 * Hero frame: the SVG’s painted gradient is taller than the letterforms, leaving a band of empty
 * space below the artwork. A wider aspect + overflow clips that band. The splash hero renders this
 * asset **inline** (`SplashHeroWordmark`) so WebKit keeps vectors crisp; `preserveAspectRatio` is
 * adjusted there to mirror former `object-cover` + `object-top`.
 */
export const brandHeroWordmarkAspectFrameClassNames =
  'mx-auto block aspect-[16/5] w-[100vw] max-w-none overflow-hidden sm:aspect-[71/20] sm:w-full sm:max-w-[min(96vw,70rem)] md:max-w-[min(94vw,78rem)] lg:max-w-[min(92vw,86rem)] xl:max-w-[min(90vw,94rem)]';

/** Legacy `<img>` hero classes; splash hero uses inline SVG (`SplashHeroWordmark.jsx`) instead. */
export const brandHeroWordmarkImgClassNames =
  'block h-full w-full min-h-0 object-cover object-top';

/**
 * Mobile “1.2×” via **layout width** (`120vw` + `-ml-[10vw]`) so the graphic scales as vector paint,
 * not `transform: scale()` (compositor can soften on iOS). `sm:` restores contained width.
 */
export const brandHeroWordmarkScaleWrapperClassNames =
  'block w-full overflow-visible max-sm:w-[120vw] max-sm:max-w-none max-sm:-ml-[10vw] motion-reduce:max-sm:w-full motion-reduce:max-sm:ml-0 sm:ml-0 sm:w-full';

/**
 * Per-surface img `className` tokens. Contexts differ in bar height and horizontal budget,
 * so reuse the same file with different constraints (do not rely on one global size).
 */
export const brandWordmarkImgClassNames = {
  /**
   * Fixed splash header (`h-16` / `h-20` bar). Wide gradient lockup: height-led + `max-w` so CTAs fit.
   */
  /** Heights absorb former wrapper scale (1.28 / 1.18) so we avoid transform blur on device. */
  splashHeader:
    'block h-[5.05rem] w-auto max-w-[calc(100vw_-_8.5rem)] object-contain object-left sm:h-[4.55rem] sm:max-w-[min(54vw,360px)]',
  /**
   * Desktop sidebar: width-led (`w-full h-auto`) so the ~2.5:1 crop uses the full column; fixed
   * height + object-contain was capping width and made the lockup tiny vs nav labels.
   */
  dashboardSidebar:
    'block h-auto w-full max-w-full object-contain object-center md:max-h-[15.75rem]',
  /**
   * Post-login mobile bar: compact height like pre–`scale()` chrome; lockup sized with `h-*` only
   * (no wrapper transform — avoids iOS raster blur).
   */
  dashboardMobileBar:
    'block h-[3.95rem] w-auto max-w-[calc(100vw_-_7rem)] object-contain object-left sm:h-[4.05rem] sm:max-w-[min(68vw,380px)]',
};

/** Inline SVG chrome: same box as {@link brandWordmarkImgClassNames} minus `object-*` (img-only). */
export const brandWordmarkChromeSplashHeaderClassNames =
  'block h-[5.05rem] w-auto max-w-[calc(100vw_-_8.5rem)] sm:h-[4.55rem] sm:max-w-[min(54vw,360px)]';

export const brandWordmarkChromeDashboardMobileBarClassNames =
  'block h-[3.95rem] w-auto max-w-[calc(100vw_-_7rem)] sm:h-[4.05rem] sm:max-w-[min(68vw,380px)]';

/**
 * No `scale()` — img `h-*` carries size (sharper on WebKit).
 * `flex` + `w-max` + `justify-start` pins the lockup to the leading edge (avoids `inline-block`
 * offset vs `inline-flex` parents; matches pre-scale optical left alignment).
 */
export const brandWordmarkSplashHeaderScaleWrapperClassNames =
  'flex w-max max-w-full shrink-0 items-center justify-start motion-reduce:transform-none';

/** Same leading-edge contract as splash header (post-auth mobile bar). */
export const brandWordmarkDashboardMobileBarScaleWrapperClassNames =
  'flex w-max max-w-full shrink-0 items-center justify-start motion-reduce:transform-none';

/**
 * Sidebar: `md:flex` + `origin-center` + `object-center` on the img centers the lockup in `w-64`;
 * scale boosts height vs nav labels.
 */
export const brandWordmarkDashboardSidebarScaleWrapperClassNames =
  'block w-full max-w-full origin-left scale-[1.02] motion-reduce:scale-100 md:flex md:origin-center md:justify-center md:scale-100';
