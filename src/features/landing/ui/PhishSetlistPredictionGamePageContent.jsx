import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { LINK_ON_LIGHT } from '../../../shared/ui/surfaceLinkStyles';
import AppDocumentAuthLink from './AppDocumentAuthLink';

/**
 * Keyword-intent educational page for `/phish-setlist-prediction-game` (#660 / #940).
 * Copy source: `content/marketing/942-content-ia-drafts.md`.
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
          Setlist Pick&apos;Em is a free live{' '}
          <strong className="font-semibold text-slate-800">setlist picks game</strong> for fans who
          love predicting setlists—built first for Phish, designed as a home for more bands soon.
          Lock openers, closers, encore, and a wildcard before showtime; score as the night unfolds.
        </p>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            What is a setlist prediction game?
          </h2>
          <p>
            A{' '}
            <strong className="font-semibold text-slate-800">setlist prediction game</strong>
            —sometimes called a{' '}
            <strong className="font-semibold text-slate-800">fantasy setlist</strong> game—asks you
            to call songs and where they land in the setlist before the show. You compete in private
            pools and on the global leaderboard while scores update live.
          </p>
          <p>Use the app to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Call slots (openers, closers, encore, wildcard)</li>
            <li>Score live as songs are played</li>
            <li>
              Climb show and tour boards with friends, and everyone playing the game on the global
              leaderboard
            </li>
          </ul>
          <p>
            Fans have called the set on paper and in group chats for years. Setlist Pick&apos;Em
            turns that ritual into a live game. We&apos;re live with Phish today and building toward
            more bands soon.
          </p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Fantasy setlists, without the spreadsheet
          </h2>
          <p>
            We track points for slot hits, wildcards, and Bustout Boost™ longshots automatically.
            Full values:{' '}
            <Link to="/how-scoring-works" className={LINK_ON_LIGHT}>
              how scoring works
            </Link>
            .
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-900">Before:</strong> lock picks before showtime
            </li>
            <li>
              <strong className="text-slate-900">During:</strong> live scoring and standings—at the
              venue or on couch tour
            </li>
            <li>
              <strong className="text-slate-900">After:</strong> final grades, tour standings,
              personal stats that grow every night you play
            </li>
          </ul>
          <p>
            <Link to="/tour-stats" className={LINK_ON_LIGHT}>
              Tour stats
            </Link>{' '}
            (frequency, bustouts, gaps) refresh every night the band plays live. Playing unlocks
            personal stats—picking average, Bustout Boost™ hits, and your pick heatmap.
          </p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className="font-display text-2xl font-bold text-slate-900">How to play</h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>Create a free account—tonight&apos;s setlist card opens.</li>
            <li>
              Pick Set 1 opener/closer, Set 2 opener/closer, encore, and wildcard.
            </li>
            <li>
              Watch scores update live; climb boards or invite a private pool.
            </li>
          </ol>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              to="/how-it-works"
              className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}
            >
              How it works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/how-scoring-works"
              className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}
            >
              How scoring works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/tour-stats" className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}>
              Tour stats
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>

        <div className="flex justify-center border-t border-slate-200 pt-10">
          <AppDocumentAuthLink
            signup
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-10 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-brand-primary-hover hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            Start predicting setlists
          </AppDocumentAuthLink>
        </div>
      </div>
    </article>
  );
}
