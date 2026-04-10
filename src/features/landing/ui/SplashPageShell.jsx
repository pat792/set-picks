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

        {children}
      </div>
    </>
  );
}
