import React, { useEffect, useRef } from 'react';

import { FeatureNewBadge } from '../../feature-discovery';
import { resolveBadgeLadder } from '../model/badgeCatalog';
import { trackBadgeShelfView } from '../model/profileEngagementAnalytics';

/**
 * Milestone badges shelf (#568): the full catalog ladder in hierarchy order.
 * Earned badges render in color; unearned ones as shadow (grayscale/dimmed)
 * tiles so the remaining milestones are visible (#710).
 *
 * @param {{
 *   badges?: Record<string, unknown> | null,
 *   surface?: 'profile' | 'public_profile',
 *   showNewBadge?: boolean,
 * }} props
 */
export default function BadgeShelf({
  badges = null,
  surface = 'profile',
  showNewBadge = false,
}) {
  const ladder = resolveBadgeLadder(badges);
  const earnedCount = ladder.filter((b) => b.earned).length;
  const viewLoggedRef = useRef(false);

  useEffect(() => {
    if (viewLoggedRef.current) return;
    viewLoggedRef.current = true;
    trackBadgeShelfView({
      surface,
      badge_count: earnedCount,
    });
  }, [surface, earnedCount]);

  return (
    <section className="mt-6 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-content-secondary">
        Badges
        {showNewBadge ? <FeatureNewBadge title="New: milestone badges" /> : null}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ladder.map((badge) => (
          <li
            key={badge.id}
            title={badge.blurb}
            className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center ${
              badge.earned
                ? 'border-border-subtle bg-surface-field'
                : 'border-dashed border-border-subtle/60 bg-surface-field/40'
            }`}
          >
            <img
              src={badge.src}
              alt=""
              width={48}
              height={48}
              className={`h-12 w-12 ${
                badge.earned ? '' : 'opacity-30 grayscale'
              }`}
              decoding="async"
            />
            <p
              className={`text-[11px] font-black uppercase leading-snug tracking-wide ${
                badge.earned ? 'text-brand-primary' : 'text-content-secondary/70'
              }`}
              aria-label={`${badge.name}. ${badge.blurb}${
                badge.earned ? '' : ' Not earned yet.'
              }`}
            >
              {badge.name}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
