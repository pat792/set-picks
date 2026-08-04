import { useCallback, useRef } from 'react';

/**
 * Section scroll + focus helpers for splash How it works / About.
 * Auth CTAs no longer scroll to a Get Started chooser — they go to `/login`.
 */
export default function useScrollToSectionFocus() {
  const howItWorksSectionRef = useRef(null);
  const howItWorksHeadingRef = useRef(null);
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

  const handleScrollToAbout = useCallback(() => {
    scrollToSectionFocus(aboutSectionRef, aboutHeadingRef);
  }, [scrollToSectionFocus]);

  return {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
    handleScrollToHowItWorks,
    handleScrollToAbout,
  };
}
