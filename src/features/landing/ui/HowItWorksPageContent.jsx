import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import {
  CARD_LINK_ON_LIGHT,
  LINK_ON_LIGHT,
} from '../../../shared/ui/surfaceLinkStyles';

/**
 * Standalone "How It Works" content for the `/how-it-works` public page.
 */
export default function HowItWorksPageContent() {
  return (
    <section className="relative z-10 w-full bg-slate-50 py-20 md:py-24 lg:py-32">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-center font-display text-display-lg font-bold text-slate-900 md:text-display-lg-lg">
          How to Play Setlist Pick&apos;Em
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-slate-600">
          The free live{' '}
          <Link to="/phish-setlist-prediction-game" className={LINK_ON_LIGHT}>
            setlist prediction game
          </Link>{' '}
          for Phish fans—and a home for more bands soon. Lock your picks before the lights go down,
          score as the setlist unfolds, and compete with friends.
        </p>
        <p className="mx-auto mb-12 max-w-2xl text-center text-base leading-relaxed text-slate-500">
          We keep an eye on the tour for you: key song trends and bustout signals on{' '}
          <Link to="/tour-stats" className={LINK_ON_LIGHT}>
            tour stats
          </Link>{' '}
          update every night the band plays live. Sign in to unlock personal stats as you earn points
          and climb the board against other setlist pickers.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 md:items-start md:p-8 md:text-left">
            <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-600">1</div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Lock It In</h2>
            <p className="leading-relaxed text-slate-600">
              Pick openers, closers, encore and wildcard before showtime. Earn points for correct
              picks, higher points for exact slot picks, plus a Bustout Boost&trade; for calling longshots.
            </p>
            <Link to="/how-scoring-works" className={CARD_LINK_ON_LIGHT}>
              Learn how scoring works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 md:items-start md:p-8 md:text-left">
            <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-black text-blue-600">2</div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Watch It Unfold</h2>
            <p className="leading-relaxed text-slate-600">
              Live scores and standings update as songs are played. See your picks—and your
              friends&apos;—light up the leaderboard.
            </p>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 md:items-start md:p-8 md:text-left">
            <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-black text-purple-600">3</div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Claim the Crown</h2>
            <p className="leading-relaxed text-slate-600">
              Challenge friends in private pools and compete in global standings. Your personal
              stats grow with every show you play—across the tour and beyond.
            </p>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          Peek at public{' '}
          <Link to="/tour-stats" className={LINK_ON_LIGHT}>
            tour setlist stats
          </Link>{' '}
          anytime—then play to unlock the personal side of the story.
        </p>
        <div className="mt-10 flex justify-center">
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
