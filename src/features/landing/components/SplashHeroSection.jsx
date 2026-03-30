import React from 'react';
import Button from '../../../shared/ui/Button';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  return (
    // Padding pt-[4.25rem] sm:pt-20 clears the fixed header on all screen sizes
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden pt-[3.5rem] sm:pt-20">
      
      {/* ADDED: -translate-y-8 sm:-translate-y-12 for optical centering to close the gap */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center -translate-y-8 sm:-translate-y-12">
        
        {/* TITLE: Responsive line break forces "SETLIST" and "PICK 'EM" onto their own lines on mobile */}
        <h1 className="mx-auto max-w-full font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 drop-shadow-xl pr-2 md:pr-4 leading-tight whitespace-normal md:whitespace-nowrap">
          SETLIST <br className="md:hidden" /> PICK &apos;EM
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
        
        {/* BUTTONS: Now using pure React components, no messy Tailwind strings! */}
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 w-full max-w-[280px] sm:max-w-none mx-auto">
          <Button
            variant="primary"
            type="button"
            onClick={onHowItWorksClick}
            className="w-full sm:w-auto"
          >
            Game Format
          </Button>
          
          <Button
            variant="glass"
            type="button"
            onClick={onPlayNowClick}
            aria-label="Play now: go to sign in or create an account"
            className="w-full sm:w-auto"
          >
            Make Picks Now
          </Button>
          
          <Button
            variant="glass"
            type="button"
            onClick={onAboutClick}
            aria-label={"About Setlist Pick 'Em"}
            className="w-full sm:w-auto"
          >
            About
          </Button>
        </div>
      </div>
    </section>
  );
}