import React, { useMemo } from 'react';

import {
  brandWordmarkChromeSplashHeaderClassNames,
  brandWordmarkSplashHeaderScaleWrapperClassNames,
} from '../../../shared/config/branding';
import { getBrandChromeWordmarkSvgMarkup } from '../../../shared/lib/brandGradientWordmarkSvg.js';
import Button from '../../../shared/ui/Button';

export default function SplashHeader({
  onPlayNowClick,
  onSignInClick,
}) {
  const wordmarkMarkup = useMemo(() => getBrandChromeWordmarkSvgMarkup(), []);

  // If `h-[5.35rem]` / `sm:h-[5.25rem]` change, update `splashSectionScrollMarginClassName`
  // in `features/landing/lib/splashScrollMargin.js` (splash scroll-into-view offset).
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[5.35rem] items-center overflow-visible border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg transition-all duration-300 sm:h-[5.25rem]">
      <div className="grid h-full w-full max-w-7xl min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-visible pl-[max(1rem,env(safe-area-inset-left,0px))] pr-4 sm:flex sm:justify-between sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex min-w-0 items-center justify-start justify-self-start overflow-visible pl-0 pr-1 text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm max-sm:-translate-x-[1.125rem] sm:shrink-0 sm:translate-x-0 sm:justify-self-auto sm:pr-2"
          aria-label={"Setlist Pick 'Em — scroll to top"}
        >
          <span className={brandWordmarkSplashHeaderScaleWrapperClassNames}>
            <span
              className={`${brandWordmarkChromeSplashHeaderClassNames} isolate`}
              dangerouslySetInnerHTML={{ __html: wordmarkMarkup }}
            />
          </span>
        </button>

        <div className="flex min-w-0 items-center justify-self-end gap-0.25 sm:justify-self-auto sm:gap-4">
          <Button
            variant="text"
            size="none"
            onClick={onSignInClick}
            className="text-sm sm:text-sm whitespace-nowrap"
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPlayNowClick}
            className="py-2.5"
          >
            Jump on Tour
          </Button>
        </div>
      </div>
    </header>
  );
}
