import React from 'react';
import Button from '../../../components/ui/Button';

export default function SplashHeader({
  onPlayNowClick,
  onSignInClick,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5 h-16 sm:h-20 flex items-center transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand / Logo */}
        <Button
          variant="text"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-bold italic text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity pr-2 px-0 py-0"
        >
          SETLIST PICK &apos;EM
        </Button>

        {/* Right: CTA Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="text"
            type="button"
            onClick={onSignInClick}
            className="text-xs sm:text-sm transition-colors focus-visible:ring-blue-500 rounded-sm px-0 py-0"
          >
            Log in
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={onPlayNowClick}
            className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm shadow-md hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
          >
            Jump on Tour
          </Button>
        </div>

      </div>
    </header>
  );
}