import React, { useCallback, useRef } from 'react';
import { useSplashAuth } from '../auth/useSplashAuth';
import SplashSignUpModal from '../auth/components/SplashSignUpModal';
import SplashSignInModal from '../auth/components/SplashSignInModal';
import SplashHeader from './components/SplashHeader';
import SplashHeroSection from './components/SplashHeroSection';
import SplashHowItWorksSection from './components/SplashHowItWorksSection';
import SplashGetStartedSection from './components/SplashGetStartedSection';
import SplashAboutSection from './components/SplashAboutSection';

function useScrollToSectionFocus() {
  return useCallback((sectionRef, focusRef) => {
    if (!sectionRef?.current) return;
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    const delay = shouldReduceMotion ? 0 : 350;
    window.setTimeout(() => {
      focusRef?.current?.focus();
    }, delay);
  }, []);
}

export default function Splash() {
  const {
    authModal,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    error,
    resetLinkNotice,
    closeModal,
    openSignUpModal,
    openSignInModal,
    handleGoogle,
    handleEmailSignUp,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
  } = useSplashAuth();

  const howItWorksSectionRef = useRef(null);
  const howItWorksHeadingRef = useRef(null);
  const getStartedSectionRef = useRef(null);
  const getStartedHeadingRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const aboutHeadingRef = useRef(null);

  const scrollToSectionFocus = useScrollToSectionFocus();

  const handleScrollToHowItWorks = useCallback(() => {
    scrollToSectionFocus(howItWorksSectionRef, howItWorksHeadingRef);
  }, [scrollToSectionFocus]);

  const handleScrollToGetStarted = useCallback(() => {
    scrollToSectionFocus(getStartedSectionRef, getStartedHeadingRef);
  }, [scrollToSectionFocus]);

  const handleScrollToAbout = useCallback(() => {
    scrollToSectionFocus(aboutSectionRef, aboutHeadingRef);
  }, [scrollToSectionFocus]);

  const handleCreateAccountFromHowItWorks = useCallback(() => {
    if (!getStartedSectionRef.current) {
      openSignUpModal();
      return;
    }
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    getStartedSectionRef.current.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    const delay = shouldReduceMotion ? 0 : 350;
    window.setTimeout(() => {
      openSignUpModal();
    }, delay);
  }, [openSignUpModal, scrollToSectionFocus]);

  return (
    // REMOVED: overflow-x-hidden from this absolute root wrapper
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col relative">
      
      {/* HEADER: Placed at the root, completely free of overflow traps so it stays sticky on iOS */}
      <SplashHeader 
        onPlayNowClick={handleScrollToGetStarted}
        onSignInClick={openSignInModal}
      />

      {/* MAIN: Wrapped the rest of the page content WITH the overflow protection */}
      <main className="flex-1 w-full relative overflow-x-hidden">
        
        {/* UPDATED: Changed emerald-500/20 to teal-400/20 to match the new brand glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-400/20 blur-[120px] rounded-full pointer-events-none" />

        <SplashHeroSection
          onHowItWorksClick={handleScrollToHowItWorks}
          onPlayNowClick={handleScrollToGetStarted}
          onAboutClick={handleScrollToAbout}
        />
        <SplashHowItWorksSection
          sectionRef={howItWorksSectionRef}
          headingRef={howItWorksHeadingRef}
          onCreateAccountClick={handleCreateAccountFromHowItWorks}
        />
        <SplashGetStartedSection
          sectionRef={getStartedSectionRef}
          headingRef={getStartedHeadingRef}
          onOpenSignUp={openSignUpModal}
          onOpenSignIn={openSignInModal}
        />
        <SplashAboutSection
          sectionRef={aboutSectionRef}
          headingRef={aboutHeadingRef}
          onHowItWorksClick={handleScrollToHowItWorks}
          onGetStartedClick={handleScrollToGetStarted}
        />
      </main>

      {/* MODALS: Safely at the root level so they overlay everything correctly */}
      <SplashSignUpModal
        isOpen={authModal === 'signup'}
        closeModal={closeModal}
        busy={busy}
        handleGoogle={handleGoogle}
        handleEmailSignUp={handleEmailSignUp}
        email={email}
        setEmail={setEmail}
        password={password}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        error={error}
      />

      <SplashSignInModal
        isOpen={authModal === 'signin'}
        closeModal={closeModal}
        busy={busy}
        handleGoogle={handleGoogle}
        handleEmailSignIn={handleEmailSignIn}
        handleSendPasswordResetEmail={handleSendPasswordResetEmail}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        resetLinkNotice={resetLinkNotice}
        error={error}
      />
    </div>
  );
}