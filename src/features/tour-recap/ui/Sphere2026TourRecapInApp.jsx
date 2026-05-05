import React from 'react';
import { BarChart3, Globe2, Trophy } from 'lucide-react';

import { SPHERE_2026_META, SPHERE_2026_PODIUM, getSphere2026PersonalParagraph } from '../model/sphere2026Recap.js';

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
 * Rich in-app tour recap (Sphere 2026). Icons use Lucide; copy is driven by {@link getSphere2026PersonalParagraph}.
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} props
 */
export default function Sphere2026TourRecapInApp({
  rank,
  points,
  wins,
  showsPlayed,
  participantCount = SPHERE_2026_META.participantCount,
}) {
  const podium = SPHERE_2026_PODIUM;
  const champion = podium.rows[0];
  const personal = getSphere2026PersonalParagraph({
    rank,
    points,
    wins,
    showsPlayed,
    participantCount,
  });

  return (
    <article className="space-y-3 text-sm font-bold leading-relaxed text-content-secondary">
      <header className="space-y-2 border-b border-border-muted/40 pb-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400/90">
          <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
          Tour recap
        </p>
        <h1 className="font-display text-display-sm font-bold uppercase tracking-tight text-white">
          {SPHERE_2026_META.headline}
        </h1>
      </header>

      <p>
        The visuals were mind-bending, the haptics were rumbling, and the very first Setlist Pick&apos;em tour
        is officially in the books.
      </p>
      <p>
        Calling Phish setlists is an inexact science on a good day, but doing it during a {SPHERE_2026_META.showCount}
        -show run at the Sphere proved to be an entirely different beast. We saw massive bust-outs, wild curveballs,
        and completely unpredictable encores. Despite the band keeping us entirely on our toes, {participantCount} of
        you stepped up to the plate to lay down your picks.
      </p>
      <p>Before we look ahead to the summer tour, let&apos;s look at the final tape from the desert.</p>

      <SectionHeading icon={Trophy} label="The Podium" id="sphere-recap-podium" />
      <p>
        A massive congratulations to our inaugural champion, <span className="text-white">{champion.handle}</span>.
        Taking down {champion.wins} nightly wins across {SPHERE_2026_META.showCount} shows to secure{' '}
        {champion.points} total points is a dominant performance.
      </p>
      <p>The race for the top was incredibly tight down the stretch:</p>
      <ol className="list-decimal space-y-2 pl-5 text-white">
        {podium.rows.map((row, i) => (
          <li key={row.handle}>
            {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}: {row.handle} ({row.points} Pts, {row.wins} Wins)
          </li>
        ))}
      </ol>
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

      <SectionHeading icon={BarChart3} label="Your Final Sphere '26 Result" id="sphere-recap-you" />
      <p className="rounded-xl border border-border-muted/45 bg-surface-inset p-4 text-content-secondary">
        {personal}
      </p>

      <footer className="space-y-3 border-t border-border-muted/40 pt-6 text-content-secondary">
        <p>
          Thank you to everyone who tested the waters, submitted picks, and made this inaugural run a massive success.
          The code is getting polished, the UI is getting tightened up, and Setlist Pick&apos;em will be back and better
          than ever for the next run of shows.
        </p>
        <p className="text-white">Until then, read the book.</p>
      </footer>
    </article>
  );
}
