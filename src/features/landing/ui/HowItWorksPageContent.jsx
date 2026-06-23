import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Standalone "How It Works" content for the `/how-it-works` public page.
 * Mirrors `SplashHowItWorksSection` but replaces the scoring-rules modal
 * trigger with a direct `<Link>` to `/how-scoring-works`, so this component
 * can render without a `ScoringRulesModalProvider`.
 */
export default function HowItWorksPageContent() {
  return (
    <section className="relative z-10 w-full bg-slate-50 py-20 md:py-24 lg:py-32">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-center font-display text-display-lg font-bold text-slate-900 md:text-display-lg-lg">
          How to Play Setlist Pick&apos;Em
        </h1>
        <p className="mb-12 text-center text-slate-600 text-lg max-w-2xl mx-auto">
          The free live setlist prediction game for Phish fans. Lock your picks before the lights
          go down and compete in real-time as songs are played.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black shrink-0 text-xl mb-5">1</div>
            <h2 className="font-bold text-xl text-slate-900 mb-3">Lock It In</h2>
            <p className="text-slate-600 leading-relaxed">
              Pick openers, closers, encore and wildcard before showtime. Earn points for correct
              picks, higher points for exact slot picks, plus a Bustout Boost&trade; for calling longshots.
            </p>
            <Link
              to="/how-scoring-works"
              className="mt-4 inline-flex items-center gap-1 rounded-md text-sm font-bold text-emerald-700 underline underline-offset-4 decoration-emerald-300 transition-colors hover:text-emerald-800 hover:decoration-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
            >
              Learn how scoring works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0 text-xl mb-5">2</div>
            <h2 className="font-bold text-xl text-slate-900 mb-3">Watch It Unfold</h2>
            <p className="text-slate-600 leading-relaxed">
              Live scores and standings update in real-time as songs are played. See your picks and
              everyone else&apos;s light up the leaderboard.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0 text-xl mb-5">3</div>
            <h2 className="font-bold text-xl text-slate-900 mb-3">Claim the Crown</h2>
            <p className="text-slate-600 leading-relaxed">
              Challenge friends in private pools and compete in global standings with everyone
              playing that night. See all-time stats in private pools to compete across tours and years.
            </p>
          </div>
        </div>
        <div className="mt-14 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-10 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-brand-primary-hover hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            Play for Free
          </Link>
        </div>
      </div>
    </section>
  );
}
