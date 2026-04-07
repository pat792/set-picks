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
      /**
       * Semantic design tokens (Target 0: design system foundation).
       * Derived from Button.jsx, SplashHeroSection, and dashboard containers (Standings, Admin, forms).
       */
      colors: {
        brand: {
          /** Venue base — Tailwind `indigo-950` (The Kuroda) */
          bg: '#1e1b4b',
          'bg-deep': '#0f0a2e',
          primary: '#2dd4bf',
          'primary-strong': '#14b8a6',
          kicker: '#2dd4bf',
          /** Primary CTA fill — Tailwind `green-400` */
          cta: '#4ade80',
          'cta-hover': '#86efac',
          'cta-ink': '#052e16',
          accent: {
            red: '#ef4444',
            blue: '#3b82f6',
          },
        },
        surface: {
          glass: 'rgb(30 27 75 / 0.35)',
          panel: 'rgb(67 56 202 / 0.38)',
          'panel-strong': 'rgb(55 48 163 / 0.72)',
          inset: 'rgb(30 27 75 / 0.5)',
          field: '#1e1b4b',
        },
        border: {
          glass: 'rgba(255, 255, 255, 0.25)',
          subtle: 'rgb(51 65 85 / 0.5)',
          muted: 'rgb(71 85 105 / 0.6)',
          /** Kuroda panel accents */
          venue: 'rgba(34, 211, 238, 0.22)',
          'venue-magenta': 'rgba(232, 121, 249, 0.18)',
        },
      },
      boxShadow: {
        'glow-brand': '0 0 40px -10px rgba(45, 212, 191, 0.5)',
        'glow-brand-lg': '0 0 60px -15px rgba(45, 212, 191, 0.7)',
        'glow-cta': '0 0 40px -10px rgba(74, 222, 128, 0.55)',
        'glow-cta-lg': '0 0 60px -15px rgba(74, 222, 128, 0.65)',
        'glow-kicker': '0 0 12px rgba(45, 212, 191, 0.5)',
        'inset-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      ringColor: {
        brand: '#2dd4bf',
      },
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