import React from 'react';

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
  return (
    <>
      {/* Fixed + flex parent breaks iOS Safari; header must sit outside the flex wrapper. */}
      <SplashHeader onPlayNowClick={onScrollToGetStarted} onSignInClick={onOpenSignInModal} />

      <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col relative">
        <main className="flex-1 w-full relative overflow-x-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-400/20 blur-[120px] rounded-full pointer-events-none" />

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

        {children}
      </div>
    </>
  );
}
