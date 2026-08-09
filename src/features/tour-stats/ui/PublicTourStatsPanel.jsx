import React from 'react';
import { Link } from 'react-router-dom';

import { AppDocumentAuthLink } from '../../landing';
import TourStatsView from '../ui/TourStatsView';
import { LINK_ON_DARK } from '../../../shared/ui/surfaceLinkStyles';

/**
 * Public marketing chrome around tour stats (#665).
 */
export default function PublicTourStatsPanel({
  tours,
  activeSlug,
  tourName,
  heading,
  hasTour,
  indexLoading,
  statsLoading,
  error,
  stats,
  onSelectTour,
}) {
  const h1 =
    heading ||
    (hasTour && tourName
      ? `${tourName} setlist statistics`
      : 'Phish tour setlist statistics');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3 text-center sm:text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">
          Tour Insights
        </p>
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
          {h1}
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          Tour Insights is our window on the latest Phish tour setlist
          statistics—most-played songs, bustouts by tour (summer, fall, Sphere,
          and more), and gap highlights that help you sharpen picks. Flip the
          tour filter, scan what&apos;s getting played, hunt the bustouts, and
          check the high-gap songs that might be due. Statistics refresh every
          night the band plays live, so the picture keeps getting sharper as the
          tour rolls on.
        </p>
        <p className="text-sm leading-relaxed text-slate-400">
          We&apos;re starting with Phish and building toward more bands soon.
          Playing the game unlocks your personal stats as you rack up points and
          compete with other setlist pickers. New to the format? See{' '}
          <Link to="/how-it-works" className={LINK_ON_DARK}>
            how it works
          </Link>{' '}
          or what makes this a{' '}
          <Link to="/phish-setlist-prediction-game" className={LINK_ON_DARK}>
            Phish setlist prediction game
          </Link>
          . This page stays focused on tour-wide song trends—not a full
          night-by-night setlist archive.
        </p>
      </header>

      {tours.length > 0 ? (
        <label className="mb-6 flex flex-col gap-2 sm:max-w-xs">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Tour filter
          </span>
          {/*
            Teal chrome via border (not ring): Safari often drops box-shadow rings
            on native <select>; appearance-none + border matches Chrome (#927).
          */}
          <div className="relative">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border-2 border-teal-400 bg-brand-bg-deep py-2.5 pl-3 pr-10 text-sm font-semibold text-white outline-none transition-colors focus-visible:border-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              value={activeSlug}
              onChange={(e) => onSelectTour(e.target.value)}
              disabled={indexLoading}
            >
              {tours.map((t) => (
                <option key={t.tourSlug} value={t.tourSlug}>
                  {t.tourLabel}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-teal-300"
              aria-hidden
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </label>
      ) : indexLoading ? (
        <div
          className="mb-6 h-[4.25rem] animate-pulse rounded-xl border border-white/10 bg-white/5 sm:max-w-xs"
          aria-hidden
        />
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load public tour stats. Try again later.
        </p>
      ) : null}

      <TourStatsView
        tourName={tourName}
        hasTour={hasTour}
        calendarLoading={indexLoading}
        setlistLoading={statsLoading}
        setlistError={error}
        stats={stats}
        setlistReads={0}
        overlay={null}
        overlayLoading={false}
      />

      <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          Ready to compete on the next show? Or skim{' '}
          <Link to="/how-scoring-works" className={LINK_ON_DARK}>
            how scoring works
          </Link>{' '}
          first.
        </p>
        <AppDocumentAuthLink
          signup
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 px-8 py-3.5 text-base font-black text-slate-900 shadow-[0_0_40px_-10px_rgba(45,212,191,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_-15px_rgba(45,212,191,0.7)] active:translate-y-0 active:scale-[0.98]"
        >
          Make picks for this tour
        </AppDocumentAuthLink>
      </div>
    </div>
  );
}
