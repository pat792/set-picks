import React from 'react';
import Button from "../../../components/ui/Button";

export default function SplashHeader({
  onPlayNowClick,
  onSignInClick,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5 h-16 sm:h-20 flex items-center transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand / Logo - Bumped up mobile text sizes! */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-bold italic text-base min-[375px]:text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity pr-2 shrink-0 whitespace-nowrap"
        >
          SETLIST PICK &apos;EM
        </button>

        {/* Right: CTA Buttons - Dropped gap-3 to gap-1.5 for a tighter mobile layout! */}
        <div className="flex items-center gap-1.0 sm:gap-4 shrink-0">
          <Button
            variant="text"
            size="none"
            onClick={onSignInClick}
            className="text-xs sm:text-sm"
          >
            Log in
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPlayNowClick}
          >
            Jump on Tour
          </Button>
        </div>

      </div>
    </header>
  );
}