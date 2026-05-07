import React from 'react';

import {
  BRAND_SPLASH_HEADER_VINYL_MARK_SRC,
  brandSplashHeaderVinylMarkImgClassNames,
  brandWordmarkSplashHeaderLeadingClassNames,
} from '../../../shared/config/branding';
import BrandWordmarkBarRow from '../../../shared/ui/BrandWordmarkBarRow';
import Button from '../../../shared/ui/Button';

export default function SplashHeader({
  onPlayNowClick,
  onSignInClick,
}) {
  // If `h-[5.35rem]` / `sm:h-[5.25rem]` change, update `splashScrollPadding.js` (html scroll-padding).
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[5.35rem] items-center overflow-visible border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg transition-all duration-300 sm:h-[5.25rem]">
      <BrandWordmarkBarRow variant="splash">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={brandWordmarkSplashHeaderLeadingClassNames}
          aria-label={"Setlist Pick 'Em — scroll to top"}
        >
          <img
            src={BRAND_SPLASH_HEADER_VINYL_MARK_SRC}
            alt={"Setlist Pick 'Em"}
            width={512}
            height={508}
            decoding="async"
            className={brandSplashHeaderVinylMarkImgClassNames}
          />
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
      </BrandWordmarkBarRow>
    </header>
  );
}
