import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Users } from 'lucide-react';

import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import DashboardRowPill from '../../../shared/ui/DashboardRowPill';

const HOW_IT_WORKS_BODY = (
  <div className="space-y-3 text-sm font-medium leading-relaxed text-content-secondary">
    <p>
      A pool is a private group with one shared hub: active show, members, and
      pool-only standings.
    </p>
    <ul className="list-disc space-y-2 pl-4 marker:text-content-secondary/70">
      <li>
        <span className="text-white/90">Join</span>—full member access to that
        pool. Any member can invite others; use{' '}
        <span className="text-white/90">Invite Friends</span> on the pool card.
      </li>
      <li>
        <span className="text-white/90">Create</span>—we give you a shareable
        invite link (text/social) and a 5-character code. Buddy next to you at
        the show? The code is often fastest—you choose.
      </li>
      <li>
        <span className="text-white/90">Invite Friends</span>—share the invite
        link via Messages, social, email, and the like, or we copy it for you.
        Same link your people use to join.
      </li>
    </ul>
  </div>
);

/**
 * Mobile-only Pools chrome (#609) — fixed under the context bar.
 * “How pools work” uses an absolute panel so the fixed stack height never grows.
 */
export default function PoolsMobileFixedChrome() {
  return (
    <DashboardMobileChromeBar heading="Pools tools" headingId="pools-mobile-chrome-heading">
      <div className="flex items-center justify-between gap-2">
        <DashboardRowPill
          as={Link}
          to="/dashboard"
          tone="muted"
          className="shrink-0 text-brand-primary hover:text-brand-primary-strong"
        >
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Go to Picks
        </DashboardRowPill>
        <details className="group relative shrink-0">
          <summary className="flex cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <DashboardRowPill as="span" tone="muted" className="uppercase tracking-widest">
              How pools work
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </DashboardRowPill>
          </summary>
          <div className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-border-subtle bg-surface-panel p-3 shadow-lg shadow-black/40">
            {HOW_IT_WORKS_BODY}
          </div>
        </details>
      </div>
    </DashboardMobileChromeBar>
  );
}
