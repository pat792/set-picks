import React from 'react';
import { BarChart3, Globe2, Trophy } from 'lucide-react';

import {
  getTourRecapPersonalParagraph,
  interpolateTourRecapCopy,
  resolveTourRecapEdition,
} from '../model/tourRecap.js';

function SectionHeading({ icon: Icon, label, id }) {
  return (
    <h2
      id={id}
      className="mt-10 mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-teal-400 first:mt-0"
    >
      <Icon className="h-5 w-5 shrink-0 text-teal-400" aria-hidden />
      {label}
    </h2>
  );
}

/**
 * Rich in-app tour recap. Copy is driven by {@link getTourRecapPersonalParagraph}
 * plus edition flavor (headline / opening / podium / closing) from the payload
 * or a passed `edition`. Preview fixtures use `PREVIEW_TOUR_EDITION`.
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 *   showCount?: number,
 *   tourName?: string,
 *   headline?: string,
 *   podium?: object,
 *   openingParas?: string[],
 *   closingLines?: string[],
 *   edition?: object,
 * }} props
 */
export default function TourRecapInApp(props) {
  const edition = resolveTourRecapEdition(props.edition, props);
  const {
    rank,
    points,
    wins,
    showsPlayed,
    participantCount = edition.participantCount,
    showCount = edition.showCount,
    tourName = edition.tourName,
    podium = edition.podium,
  } = props;
  const champion = podium?.rows?.[0];
  const personal = getTourRecapPersonalParagraph({
    rank,
    points,
    wins,
    showsPlayed,
    participantCount,
    showCount,
    tourName,
    edition,
  });
  const vars = { participantCount, showCount, tourName };
  const opening = (edition.openingParas || []).map((p) => interpolateTourRecapCopy(p, vars));
  const closing = (edition.closingLines || []).map((p) => interpolateTourRecapCopy(p, vars));

  return (
    <article className="space-y-3 text-sm font-normal leading-relaxed text-content-secondary">
      <header className="space-y-2 border-b border-border-muted/40 pb-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400/90">
          <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
          Tour recap
        </p>
        <h1 className="font-display text-display-sm font-bold uppercase tracking-tight text-white">
          {edition.headline}
        </h1>
      </header>

      {opening.map((para) => (
        <p key={para}>{para}</p>
      ))}

      <SectionHeading icon={Trophy} label="The Podium" id="tour-recap-podium" />
      {champion ? (
        <p>
          A massive congratulations to our champion, <span className="text-white">{champion.handle}</span>.
          Taking down {champion.wins} nightly wins across {showCount} shows to secure{' '}
          {champion.points} total points is a dominant performance.
        </p>
      ) : null}
      <p>The race for the top was incredibly tight down the stretch:</p>
      <ol className="list-decimal space-y-2 pl-5 text-white">
        {(podium?.rows || []).map((row, i) => (
          <li key={row.handle}>
            {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}: {row.handle} ({row.points} Pts, {row.wins} Wins)
          </li>
        ))}
      </ol>
      {podium?.honorableMentions?.length ? (
        <div>
          <p className="mb-2 text-content-secondary">Honorable mentions</p>
          <ul className="list-disc space-y-2 pl-5">
            {podium.honorableMentions.map((h) => (
              <li key={h.handle}>
                <span className="text-white">{h.handle}</span> — {h.note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <SectionHeading
        icon={BarChart3}
        label={edition.resultSectionLabel || 'Your final result'}
        id="tour-recap-you"
      />
      <p className="rounded-xl border border-border-muted/45 bg-surface-inset p-4 text-content-secondary">
        {personal}
      </p>

      <footer className="space-y-3 border-t border-border-muted/40 pt-6 text-content-secondary">
        {closing.map((para, i) => (
          <p key={para} className={i === closing.length - 1 ? 'text-white' : undefined}>
            {para}
          </p>
        ))}
      </footer>
    </article>
  );
}
