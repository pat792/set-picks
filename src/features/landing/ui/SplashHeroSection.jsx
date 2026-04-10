import React from 'react';
import {
  BRAND_HERO_WORDMARK_SRC,
  brandHeroWordmarkAspectFrameClassNames,
  brandHeroWordmarkImgClassNames,
  brandHeroWordmarkScaleWrapperClassNames,
} from '../../../shared/config/branding';
import Button from '../../../shared/ui/Button';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-transparent pt-[4.6rem] pb-6 sm:min-h-screen sm:pt-[5.25rem] sm:pb-14">
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pt-1 text-center sm:px-6 sm:pt-0 lg:px-8">
        <h1 className="relative left-1/2 w-screen max-w-[100vw] shrink-0 -translate-x-1/2 leading-none sm:left-0 sm:w-full sm:max-w-none sm:translate-x-0">
          <span className={brandHeroWordmarkScaleWrapperClassNames}>
            <span className={brandHeroWordmarkAspectFrameClassNames}>
              <img
                src={BRAND_HERO_WORDMARK_SRC}
                alt="Setlist Pick 'Em"
                className={brandHeroWordmarkImgClassNames}
                decoding="async"
                fetchpriority="high"
              />
            </span>
          </span>
        </h1>

        <div className="mx-auto mt-6 max-w-2xl shrink-0 sm:-mt-0.5 md:-mt-1">
          <p className="mb-3 text-lg font-bold tracking-wide text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] sm:mb-2 md:text-xl">
            The ultimate live music prediction game. Launching on Phish Tour.
          </p>

          <p className="text-base font-normal leading-relaxed text-slate-300 sm:leading-snug md:text-lg md:leading-relaxed">
            Join a global community of fans who live for the next song. Challenge your tour family, lock in your predictions, and share the thrill of calling a legendary show before the lights even go down.
          </p>
        </div>

        {/* Mobile: split leftover viewport 50/50 above vs below CTA (replaces mt-auto). Hidden sm+. */}
        <div className="min-h-2 flex-1 sm:hidden" aria-hidden />

        <div className="mx-auto flex w-full max-w-md shrink-0 flex-col items-center gap-5 sm:mt-6 sm:gap-4">
          <Button
            variant="primary"
            type="button"
            onClick={onPlayNowClick}
            aria-label="Play now: go to sign in or create an account"
            className="w-full sm:w-auto min-w-[12rem]"
          >
            Make picks now
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-400">
            <button
              type="button"
              className="underline decoration-slate-600 underline-offset-4 transition-colors hover:text-emerald-400"
              onClick={onHowItWorksClick}
            >
              Game format
            </button>
            <button
              type="button"
              className="underline decoration-slate-600 underline-offset-4 transition-colors hover:text-emerald-400"
              onClick={onAboutClick}
              aria-label={"About Setlist Pick 'Em"}
            >
              About
            </button>
          </div>
        </div>

        <div className="min-h-2 flex-1 sm:hidden" aria-hidden />
      </div>
    </section>
  );
}
