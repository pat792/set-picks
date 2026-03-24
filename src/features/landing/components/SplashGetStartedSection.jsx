import React from 'react';
import SplashAuthEntryCard from '../../auth/components/SplashAuthEntryCard';

export default function SplashGetStartedSection({
  sectionRef,
  headingRef,
  onOpenSignUp,
  onOpenSignIn,
}) {
  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full flex items-center py-10 md:py-12 lg:py-14 md:min-h-[80vh] lg:min-h-[88vh]"
    >
      <div className="w-full max-w-5xl mx-auto px-1 flex justify-center">
        <SplashAuthEntryCard
          headingRef={headingRef}
          onOpenSignUp={onOpenSignUp}
          onOpenSignIn={onOpenSignIn}
        />
      </div>
    </section>
  );
}
