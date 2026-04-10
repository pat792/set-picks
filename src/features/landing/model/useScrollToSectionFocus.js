import { useCallback, useRef } from 'react';

export default function useScrollToSectionFocus({ onCreateAccountRequest } = {}) {
  const howItWorksSectionRef = useRef(null);
  const howItWorksHeadingRef = useRef(null);
  const getStartedSectionRef = useRef(null);
  const getStartedHeadingRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const aboutHeadingRef = useRef(null);

  const scrollToSectionFocus = useCallback((sectionRef, focusRef) => {
    if (!sectionRef?.current) return;
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    const delay = shouldReduceMotion ? 0 : 350;
    window.setTimeout(() => {
      // Avoid a second scroll: default focus() scrolls the target into view and
      // fights smooth scrollIntoView + section scroll-margin (feels glitchy).
      focusRef?.current?.focus({ preventScroll: true });
    }, delay);
  }, []);

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
      onCreateAccountRequest?.();
      return;
    }

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    getStartedSectionRef.current.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    const delay = shouldReduceMotion ? 0 : 350;
    window.setTimeout(() => {
      onCreateAccountRequest?.();
    }, delay);
  }, [onCreateAccountRequest]);

  return {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    getStartedSectionRef,
    getStartedHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
    handleScrollToHowItWorks,
    handleScrollToGetStarted,
    handleScrollToAbout,
    handleCreateAccountFromHowItWorks,
  };
}
