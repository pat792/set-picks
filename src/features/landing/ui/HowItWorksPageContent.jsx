import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import {
  MARKETING_EDITORIAL_ARTICLE,
  MARKETING_EDITORIAL_COLUMN,
  MARKETING_EDITORIAL_H1,
  MARKETING_EDITORIAL_H2,
} from '../../../shared/ui/marketingEditorialChrome';
import { LINK_ON_LIGHT } from '../../../shared/ui/surfaceLinkStyles';
import AppDocumentAuthLink from './AppDocumentAuthLink';
import MarketingIphoneCarousel from './MarketingIphoneCarousel';

const SETLIST_CARD_SLIDES = [
  {
    src: '/images/marketing/picks-setlist-card-iphone-sample.png',
    alt: "iPhone showing the Setlist Pick 'Em Picks screen with six empty setlist card slots and a Lock In Picks button.",
    caption: 'Your setlist card before lock — six slots, then Lock In Picks.',
  },
  {
    src: '/images/marketing/picks-song-search-iphone-sample.png',
    alt: "iPhone showing song search autocomplete on Set 1 Opener with catalog stats for Total, Gap, and Last played.",
    caption: 'Search any slot — type a few letters, pick from the catalog with Total / Gap / Last.',
  },
];

/**
 * Full show-night walkthrough for `/how-it-works` (#937).
 * Distinct from splash Game Format teaser (3 cards).
 * Copy source: `content/marketing/942-content-ia-drafts.md`.
 * Chrome tokens: #944 / `marketingEditorialChrome`.
 */
export default function HowItWorksPageContent() {
  return (
    <article className={MARKETING_EDITORIAL_ARTICLE}>
      <div className={MARKETING_EDITORIAL_COLUMN}>
        <h1 className={MARKETING_EDITORIAL_H1}>
          How to Play Setlist Pick&apos;Em
        </h1>
        <p className="mb-12 text-center text-lg leading-relaxed text-slate-600">
          Setlist Pick&apos;Em is a free live{' '}
          <Link to="/phish-setlist-prediction-game" className={LINK_ON_LIGHT}>
            setlist prediction game
          </Link>{' '}
          for Phish fans—and a home for more bands soon. Here&apos;s the show-night
          walkthrough: what you lock, how scoring moves, and where your crew ranks.
        </p>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className={MARKETING_EDITORIAL_H2}>
            Your setlist card
          </h2>
          <p>Before the lights go down, you lock six calls:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Set 1 opener and closer</li>
            <li>Set 2 opener and closer</li>
            <li>Encore</li>
            <li>Wildcard</li>
          </ul>
          <MarketingIphoneCarousel
            className="pt-2"
            label="Setlist card screenshots"
            slides={SETLIST_CARD_SLIDES}
          />
          <p>
            Correct picks earn points; exact slot hits score more. Call rare songs
            and you can trigger a Bustout Boost™. For a full breakdown, check out{' '}
            <Link to="/how-scoring-works" className={LINK_ON_LIGHT}>
              how scoring works
            </Link>
            .
          </p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className={MARKETING_EDITORIAL_H2}>
            Show-night timeline
          </h2>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <strong className="text-slate-900">Before the show</strong> — Open
              tonight&apos;s card, lock picks before showtime. Peek at{' '}
              <Link to="/tour-stats" className={LINK_ON_LIGHT}>
                tour stats
              </Link>{' '}
              (song frequency, bustouts, gap highlights) that refresh every night
              the band plays live.
            </li>
            <li>
              <strong className="text-slate-900">During the show</strong> — Scores
              and standings update as songs land. Follow the live setlist in the
              app, whether you&apos;re at the venue or on couch tour.
            </li>
            <li>
              <strong className="text-slate-900">After the show</strong> — Final
              grades post for the night. Tour standings move. Personal stats grow
              every night you play.
            </li>
          </ol>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className={MARKETING_EDITORIAL_H2}>
            Pools vs global
          </h2>
          <p>Play two ways at once:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-900">Private pools</strong> — Invite
              friends for crew-only standings.
            </li>
            <li>
              <strong className="text-slate-900">Global standings</strong> —
              Compete with everyone on the board for the show and the tour.
            </li>
          </ul>
          <p>Same picks. Different rivalries.</p>
        </section>

        <section className="mb-12 space-y-4 text-base leading-relaxed text-slate-700">
          <h2 className={MARKETING_EDITORIAL_H2}>
            Personal stats unlock when you play
          </h2>
          <p>
            Tour trends on{' '}
            <Link to="/tour-stats" className={LINK_ON_LIGHT}>
              tour stats
            </Link>{' '}
            are open to everyone. Your personal story—picking average, Bustout
            Boost™ hits, pick heatmaps—unlocks as you earn points and climb the
            board.
          </p>
        </section>

        <p className="mb-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          <Link
            to="/phish-setlist-prediction-game"
            className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}
          >
            The game
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/how-scoring-works"
            className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}
          >
            How scoring works
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/tour-stats"
            className={`inline-flex items-center gap-1 ${LINK_ON_LIGHT}`}
          >
            Tour stats
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>

        <div className="flex justify-center border-t border-slate-200 pt-10">
          <AppDocumentAuthLink
            signup
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-10 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-brand-primary-hover hover:shadow-[0_15px_30px_-15px_rgba(16,185,129,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            Play for Free
          </AppDocumentAuthLink>
        </div>
      </div>
    </article>
  );
}
