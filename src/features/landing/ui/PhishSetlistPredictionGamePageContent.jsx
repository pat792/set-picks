import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Keyword-intent educational page for `/phish-setlist-prediction-game` (#660).
 */
export default function PhishSetlistPredictionGamePageContent() {
  return (
    <article className="relative z-10 w-full bg-slate-50 py-16 md:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700">
          Setlist Pick&apos;Em
        </p>
        <h1 className="mb-5 text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
          The free Phish setlist prediction game
        </h1>
        <p className="mb-10 text-center text-lg leading-relaxed text-slate-600">
          Setlist Pick&apos;Em (also called Setlist Pickem) is a live{' '}
          <strong className="font-semibold text-slate-800">setlist prediction game</strong> built
          first for Phish fans—and designed as a destination for more bands soon. Lock openers,
          closers, encore, and a wildcard before showtime, then score as the night unfolds.
        </p>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            What is a Phish setlist game?
          </h2>
          <p>
            A Phish setlist game asks you to predict songs and slots for tonight&apos;s show—not to
            dig through yesterday&apos;s archives. You compete with friends in private pools and
            with everyone on the global board. Scores update live as songs are played.
          </p>
          <p>
            We follow the tour with you. Song frequency, bustouts, and gap highlights live on our{' '}
            <Link
              to="/tour-stats"
              className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-500"
            >
              tour stats
            </Link>{' '}
            pages and refresh every night the band plays live—insights that help you stay sharp
            between shows.
          </p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            More than a setlist archive
          </h2>
          <p>
            Setlist archives are great for looking back. Setlist Pick&apos;Em is about the night
            ahead: make your calls, earn points for slots and wildcards, and chase Bustout Boosts
            when you nail the longshots.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-900">Before the show:</strong> lock picks before the
              lights go down.
            </li>
            <li>
              <strong className="text-slate-900">During the show:</strong> live scoring and
              standings as the setlist unfolds.
            </li>
            <li>
              <strong className="text-slate-900">After the show:</strong> final grades, tour
              standings, and personal stats that grow every night you play.
            </li>
          </ul>
          <p>
            Playing the game unlocks those personal stats—so you can see how you stack up as you
            accumulate points against other setlist pickers.
          </p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">How to play</h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>Create a free account and open tonight&apos;s show.</li>
            <li>
              Pick Set 1 opener/closer, Set 2 opener/closer, encore, and a wildcard.
            </li>
            <li>
              Watch scores update live; climb show and tour standings or invite friends to a pool.
            </li>
          </ol>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-500"
            >
              How it works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/how-scoring-works"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-500"
            >
              How scoring works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>

        <div className="flex justify-center border-t border-slate-200 pt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-10 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-brand-primary-hover hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            Play the Phish setlist prediction game
          </Link>
        </div>
      </div>
    </article>
  );
}
