import React, { useMemo } from 'react';

import { getBrandHeroWordmarkSvgMarkup } from '../../../shared/lib/brandGradientWordmarkSvg.js';
import {
  brandHeroWordmarkAspectFrameClassNames,
  brandHeroWordmarkScaleWrapperClassNames,
} from '../../../shared/config/branding';

/**
 * Inline SVG stays vector on mobile WebKit; `<img src=".svg">` is often rasterized (soft/grainy),
 * especially with CSS filters. Avoid box-shadow on the aspect frame — it traces the rectangular
 * box and reads as a “border” around transparent letter areas (unlike drop-shadow on an img).
 */
export default function SplashHeroWordmark() {
  const markup = useMemo(() => getBrandHeroWordmarkSvgMarkup(), []);

  return (
    <span className={brandHeroWordmarkScaleWrapperClassNames}>
      <span className={brandHeroWordmarkAspectFrameClassNames}>
        <span
          className="isolate block h-full min-h-0 w-full"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </span>
    </span>
  );
}
