/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  /**
   * Extended `fontSize` tokens (`text-display-*`) were present on nodes but computed as 16px in dev
   * (inherits preflight `h*` reset) — rules were missing from the served stylesheet. Safelist guarantees
   * emission so display typography always has matching CSS in Vite dev + production.
   */
  safelist: [
    {
      pattern: /^text-display-[-\w]+$/,
      variants: ['responsive'],
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter becomes the default font for the whole app
        sans: ['Inter', 'sans-serif'],
        // Space Grotesk becomes available via the 'font-display' class
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      fontSize: {
        body: ['0.875rem', { lineHeight: '1.5' }],
        title: ['1.5rem', { lineHeight: '1.2', fontWeight: '800' }],
        /** Space Grotesk ladder — optically bumped vs Inter so headings clear body / font-black UI */
        'display-hero': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-hero-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-xl-lg': ['2.375rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-lg': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-lg-lg': ['2.125rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-md': ['1.5rem', { lineHeight: '1.22', letterSpacing: '-0.02em' }],
        'display-md-lg': ['1.75rem', { lineHeight: '1.22', letterSpacing: '-0.02em' }],
        /** Dashboard page titles (main h2 per screen) */
        'display-page': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-page-lg': ['2.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-sm': ['1.3125rem', { lineHeight: '1.28', letterSpacing: '-0.015em' }],
        /** Product wordmark — larger than nav/UI; use with font-display + font-bold */
        'display-brand-sidebar': ['1.875rem', { lineHeight: '1.12', letterSpacing: '-0.022em' }],
        'display-brand-sidebar-lg': ['2.125rem', { lineHeight: '1.12', letterSpacing: '-0.022em' }],
        'display-brand-bar': ['1.5625rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        /** Splash hero only — above display-hero so title clearly leads body copy */
        'display-hero-splash': ['3.75rem', { lineHeight: '1.04', letterSpacing: '-0.028em' }],
        'display-hero-splash-lg': ['5rem', { lineHeight: '1.03', letterSpacing: '-0.032em' }],
      },
    },
  },
  plugins: [],
}