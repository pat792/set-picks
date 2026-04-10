import React, { useMemo } from 'react';

import { getBrandHeroWordmarkSvgMarkup } from '../../../shared/lib/brandGradientWordmarkSvg.js';
import {
  brandHeroWordmarkAspectFrameClassNames,
  brandHeroWordmarkScaleWrapperClassNames,
} from '../../../shared/config/branding';

/**
 * Inline SVG stays vector on mobile WebKit; `<img src=".svg">` is often rasterized (soft/grainy),
 * especially with CSS filters. Glow uses box-shadow on the aspect frame (no filter on the graphic).
 */
export default function SplashHeroWordmark() {
  const markup = useMemo(() => getBrandHeroWordmarkSvgMarkup(), []);

  return (
    <span className={brandHeroWordmarkScaleWrapperClassNames}>
      <span
        className={`${brandHeroWordmarkAspectFrameClassNames} shadow-[0_4px_36px_-6px_rgba(15,10,46,0.55)] sm:shadow-[0_4px_40px_-4px_rgba(15,10,46,0.5)]`}
      >
        <span
          className="isolate block h-full min-h-0 w-full"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </span>
    </span>
  );
}
