import React from 'react';
import { SplashAuthEntryCard } from '../../auth';

import { splashSectionScrollMarginClassName } from '../lib/splashScrollMargin.js';

export default function SplashGetStartedSection({
  sectionRef,
  headingRef,
  onOpenSignUp,
  onOpenSignIn,
}) {
  return (
    <section
      ref={sectionRef}
      className={`relative z-10 w-full overflow-hidden border-t border-white/5 bg-gradient-to-b from-brand-bg to-brand-bg-deep py-20 md:py-32 ${splashSectionScrollMarginClassName}`}
    >
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-teal-400/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <SplashAuthEntryCard
          headingRef={headingRef}
          onOpenSignUp={onOpenSignUp}
          onOpenSignIn={onOpenSignIn}
        />
      </div>
    </section>
  );
}
