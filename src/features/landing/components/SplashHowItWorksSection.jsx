import React from 'react';
import Button from '../../../components/ui/Button';

export default function SplashHowItWorksSection({ sectionRef, headingRef, onCreateAccountClick }) {
  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-slate-50 py-20 md:py-24 lg:py-32"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-display-lg md:text-display-lg-lg font-bold text-slate-900 mb-12 text-center outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
        >
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black shrink-0 text-xl mb-5">
              1
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Lock It In</h3>
            <p className="text-slate-600 leading-relaxed">
              Predict openers, closers, the encore, and a wildcard before the lights go down.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0 text-xl mb-5">
              2
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Watch It Unfold</h3>
            <p className="text-slate-600 leading-relaxed">
              Setlist and scores will be updated in real-time. Final official scoring will be
              confirmed at show&apos;s end.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 flex flex-col items-center text-center md:items-start md:text-left transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black shrink-0 text-xl mb-5">
              3
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Claim the Crown</h3>
            <p className="text-slate-600 leading-relaxed">
              Play in the global pool or join private pools with your crew.
            </p>
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