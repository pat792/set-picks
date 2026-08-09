import React from 'react';
import { Link } from 'react-router-dom';

import { LINK_ON_LIGHT } from '../../../shared/ui/surfaceLinkStyles';
import AppDocumentAuthLink from './AppDocumentAuthLink';

/**
 * Crawlable About / origin story for `/about` (#941).
 * Copy source: `content/marketing/942-content-ia-drafts.md`.
 */
export default function AboutPageContent() {
  return (
    <article className="relative z-10 w-full bg-slate-50 py-16 md:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
          About Setlist Pick&apos;Em
        </h1>

        <blockquote className="mb-10 border-l-4 border-teal-500/60 pl-5 text-lg italic leading-relaxed text-slate-600 md:text-xl">
          “Lock your picks, ride the scores, run with your crew—one show at a time.”
        </blockquote>

        <div className="space-y-6 text-base leading-relaxed text-slate-700 md:text-lg">
          <p>
            In <strong className="font-semibold text-slate-900">2001</strong>, on{' '}
            <strong className="font-semibold text-slate-900">Phish tour</strong> that summer,{' '}
            <strong className="font-semibold text-slate-900">Ryan M</strong>—known to friends as{' '}
            <strong className="font-semibold text-teal-700">Beaver</strong>—cooked up a game to pass
            the miles between shows. <strong className="font-semibold text-slate-900">Glu</strong>{' '}
            and <strong className="font-semibold text-slate-900">Andy F</strong> rolled with him on
            the road; in those heady years the three of them shaped the ritual—debating picks,
            refining the format, and keeping the crew laughing until the lights went down.
          </p>
          <p>
            The format was simple and addictive: pick a{' '}
            <strong className="font-semibold text-slate-900">first-set opener and closer</strong>, a{' '}
            <strong className="font-semibold text-slate-900">second-set opener and closer</strong>,
            plus <strong className="font-semibold text-slate-900">encore</strong> and a{' '}
            <strong className="font-semibold text-slate-900">wildcard</strong>. Suddenly every
            placement mattered—friendly competition, a little glory, and a reason to care where the
            next song might land.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">Pat</strong> and Ryan met in{' '}
            <strong className="font-semibold text-slate-900">kindergarten</strong> and grew up
            together; Pat was a fan of the game from the start. In the{' '}
            <strong className="font-semibold text-slate-900">2010s</strong>, Pat moved it from{' '}
            <strong className="font-semibold text-slate-900">paper to a spreadsheet</strong> so
            friends could play from different shows and cities—portable, easy to update, and a
            little more dynamic on the road.
          </p>
          <p>
            Pat had always wished it could be{' '}
            <strong className="font-semibold text-slate-900">more automated</strong> and{' '}
            <strong className="font-semibold text-slate-900">more interesting</strong>.{' '}
            <strong className="font-semibold text-slate-900">Setlist Pick&apos;Em</strong> is that
            vision taken to its logical conclusion: an interactive home for passionate fans who
            crave competition,{' '}
            <Link to="/tour-stats" className={LINK_ON_LIGHT}>
              tour stats
            </Link>
            , and fun with friends. Live with Phish today—building toward more bands soon.
          </p>
          <p>
            New here? Start with{' '}
            <Link to="/how-it-works" className={LINK_ON_LIGHT}>
              how it works
            </Link>
            . Want a brief explainer? See what makes this a{' '}
            <Link to="/phish-setlist-prediction-game" className={LINK_ON_LIGHT}>
              Phish setlist prediction game
            </Link>
            .
          </p>
        </div>

        <div className="mt-12 flex justify-center border-t border-slate-200 pt-10">
          <AppDocumentAuthLink
            signup
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-10 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-brand-primary-hover hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            Get started
          </AppDocumentAuthLink>
        </div>

        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm"
          aria-label="How it works, tour stats, or create an account"
        >
          <Link to="/how-it-works" className={LINK_ON_LIGHT}>
            How it works
          </Link>
          <span className="mx-2 select-none text-slate-400" aria-hidden>
            ·
          </span>
          <Link to="/tour-stats" className={LINK_ON_LIGHT}>
            Tour stats
          </Link>
          <span className="mx-2 select-none text-slate-400" aria-hidden>
            ·
          </span>
          <AppDocumentAuthLink signup className={LINK_ON_LIGHT}>
            Get started
          </AppDocumentAuthLink>
        </nav>
      </div>
    </article>
  );
}
