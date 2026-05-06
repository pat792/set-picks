import React from 'react';
import {
  BRAND_HERO_WORDMARK_SRC,
  brandHeroWordmarkAspectFrameClassNames,
  brandHeroWordmarkImgClassNames,
  brandHeroWordmarkScaleWrapperClassNames,
} from '../../../shared/config/branding';

/**
 * Inline SVG stays vector on mobile WebKit; `<img src=".svg">` is often rasterized (soft/grainy),
 * especially with CSS filters. Avoid box-shadow on the aspect frame — it traces the rectangular
 * box and reads as a “border” around transparent letter areas (unlike drop-shadow on an img).
 */
export default function SplashHeroWordmark() {
  return (
    <span className={brandHeroWordmarkScaleWrapperClassNames}>
      <span className={brandHeroWordmarkAspectFrameClassNames}>
        <img
          className={brandHeroWordmarkImgClassNames}
          src={BRAND_HERO_WORDMARK_SRC}
          alt=""
          aria-hidden="true"
          loading="eager"
        />
      </span>
    </span>
  );
}
