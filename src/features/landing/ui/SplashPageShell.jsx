import React from 'react';

import useSplashDocumentScrollPadding from '../model/useSplashDocumentScrollPadding';
import SplashAboutSection from './SplashAboutSection';
import SplashGetStartedSection from './SplashGetStartedSection';
import SplashHeader from './SplashHeader';
import SplashHeroSection from './SplashHeroSection';
import SplashHowItWorksSection from './SplashHowItWorksSection';

export default function SplashPageShell({
  howItWorksSectionRef,
  howItWorksHeadingRef,
  getStartedSectionRef,
  getStartedHeadingRef,
  aboutSectionRef,
  aboutHeadingRef,
  onScrollToHowItWorks,
  onScrollToGetStarted,
  onScrollToAbout,
  onCreateAccountFromHowItWorks,
  onOpenSignUpModal,
  onOpenSignInModal,
  children,
}) {
  useSplashDocumentScrollPadding();

  return (
    <>
      {/* Fixed + flex parent breaks iOS Safari; header must sit outside the flex wrapper. */}
      <SplashHeader onPlayNowClick={onScrollToGetStarted} onSignInClick={onOpenSignInModal} />

      <div className="relative flex min-h-screen w-full flex-col bg-transparent text-white">
        <main className="flex-1 w-full relative overflow-x-hidden">
          <SplashHeroSection
            onHowItWorksClick={onScrollToHowItWorks}
            onPlayNowClick={onScrollToGetStarted}
            onAboutClick={onScrollToAbout}
          />
          <SplashHowItWorksSection
            sectionRef={howItWorksSectionRef}
            headingRef={howItWorksHeadingRef}
            onCreateAccountClick={onCreateAccountFromHowItWorks}
          />
          <SplashGetStartedSection
            sectionRef={getStartedSectionRef}
            headingRef={getStartedHeadingRef}
            onOpenSignUp={onOpenSignUpModal}
            onOpenSignIn={onOpenSignInModal}
          />
          <SplashAboutSection
            sectionRef={aboutSectionRef}
            headingRef={aboutHeadingRef}
            onHowItWorksClick={onScrollToHowItWorks}
            onGetStartedClick={onScrollToGetStarted}
          />
        </main>

        <footer className="relative z-10 border-t border-slate-800/60 bg-transparent px-4 py-6 text-center text-xs font-medium leading-relaxed text-slate-500 sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} Road2 Media, LLC. All rights reserved.
          </p>
          <p className="mt-1">
            Song and setlist data provided by{' '}
            <a
              href="https://phish.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400"
            >
              The Mockingbird Foundation / Phish.Net
            </a>
            .
          </p>
        </footer>

        {children}
      </div>
    </>
  );
}
