import React from 'react';
import { ArrowRight } from 'lucide-react';

import { useScoringRulesModal } from '../../scoring';
import Button from '../../../shared/ui/Button';

export default function SplashHowItWorksSection({ sectionRef, headingRef, onCreateAccountClick }) {
  const { openScoringRules } = useScoringRulesModal();

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-slate-50 py-20 md:py-24 lg:py-32"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mb-12 rounded-md text-center font-display text-display-lg font-bold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue md:text-display-lg-lg"
        >
          Game Format
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black shrink-0 text-xl mb-5">
              1
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Lock It In</h3>
            <p className="text-slate-600 leading-relaxed">
              Pick openers, closers, encore and wildcard before showtime. Earn points for correct picks, higher points for exact slot picks, plus a Bustout Boost™ for calling longshots.
            </p>
            <button
              type="button"
              onClick={openScoringRules}
              className="mt-4 inline-flex items-center gap-1 rounded-md text-sm font-bold text-emerald-700 underline underline-offset-4 decoration-emerald-300 transition-colors hover:text-emerald-800 hover:decoration-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
            >
              Learn how scoring works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0 text-xl mb-5">
              2
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Watch It Unfold</h3>
            <p className="text-slate-600 leading-relaxed">
              Live scores and standings update in real-time as songs are played. See your picks and everyone else's light up the leaderboard.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0 text-xl mb-5">
              3
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Claim the Crown</h3>
            <p className="text-slate-600 leading-relaxed">
              Challenge friends in private pools and compete in global standings with everyone playing that night. See all-time stats in private pools to compete across tours and years.          </p>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <Button
            variant="primary"
            type="button"
            onClick={onCreateAccountClick}
            className="w-full sm:w-auto px-10 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)]"
          >
            Create Account
          </Button>
        </div>
      </div>
    </section>
  );
}
