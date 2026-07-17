import React from 'react';

import { resolveEarnedBadges } from '../model/badgeCatalog';

/**
 * Earned milestone badges shelf (#568).
 *
 * @param {{
 *   badges?: Record<string, unknown> | null,
 *   emptyLabel?: string,
 * }} props
 */
export default function BadgeShelf({
  badges = null,
  emptyLabel = 'No badges yet — play a scored show to start earning.',
}) {
  const earned = resolveEarnedBadges(badges);

  return (
    <section className="mt-6 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
      <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-content-secondary">
        Badges
      </h2>
      {earned.length === 0 ? (
        <p className="text-sm font-bold text-content-secondary">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {earned.map((badge) => (
            <li
              key={badge.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-surface-field px-2 py-3 text-center"
            >
              <img
                src={badge.src}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
                decoding="async"
              />
              <p
                className="text-[11px] font-black uppercase leading-snug tracking-wide text-brand-primary"
                aria-label={`${badge.name}. ${badge.blurb}`}
              >
                {badge.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
