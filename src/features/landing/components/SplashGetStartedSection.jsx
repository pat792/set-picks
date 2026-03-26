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
      // UPDATED: Changed to-emerald-950 to to-teal-950 for brand consistency
      className="relative z-10 w-full bg-gradient-to-b from-[#0f172a] to-teal-950 py-20 md:py-32 border-t border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        {/* UPDATED: Changed bg-emerald-500/10 to bg-teal-400/10 for the ambient glow */}
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