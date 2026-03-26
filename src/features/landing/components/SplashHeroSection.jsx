import React from 'react';
import Button from '../../../components/ui/Button';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  const glassCtaClassName =
    'w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 font-black text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors';

  return (
    // Padding pt-16 sm:pt-20 clears the fixed header on all screen sizes
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden pt-16 sm:pt-20">
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* TITLE: Locked to one line globally by dropping size to text-4xl on tiny phones */}
        <h1 className="mx-auto max-w-full font-display text-4xl min-[400px]:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-blue-500 drop-shadow-xl pr-2 md:pr-4 whitespace-nowrap">
          SETLIST PICK &apos;EM
        </h1>
        
        {/* THE NEON KICKER (Teal-400) & NEW COPY BLOCK */}
        <div className="mt-6 max-w-2xl mx-auto">
          <p className="text-lg md:text-xl text-teal-400 font-bold tracking-wide drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] mb-4">
            The ultimate live music prediction game. Launching on Phish Tour.
          </p>
          
          <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed">
            Join a global community of fans who live for the next song. Challenge your tour family, lock in your predictions, and share the thrill of calling a legendary show before the lights even go down.
          </p>
        </div>
        
        {/* BUTTONS (Primary updated to match neon Teal-400) */}
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 w-full max-w-[280px] sm:max-w-none mx-auto">
          <Button
            variant="primary"
            type="button"
            onClick={onHowItWorksClick}
            // UPDATED: from-teal-400 to-teal-500 with updated teal drop shadow (rgba(45,212,191,0.5))
            className="w-full sm:w-auto"
          >
            Game Format
          </Button>
          
          <Button
            variant="glass"
            type="button"
            onClick={onPlayNowClick}
            aria-label="Play now: go to sign in or create an account"
            // glassCtaClassName above updated to have teal focus ring
            className={glassCtaClassName}
          >
            Make Picks Now
          </Button>
          
          <Button
            variant="glass"
            type="button"
            onClick={onAboutClick}
            aria-label={"About Setlist Pick 'Em"}
            // glassCtaClassName above updated to have teal focus ring
            className={glassCtaClassName}
          >
            About
          </Button>
        </div>
      </div>
    </section>
  );
}