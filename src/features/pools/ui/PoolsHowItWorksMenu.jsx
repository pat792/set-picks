import React from 'react';
import { ChevronDown } from 'lucide-react';

import DashboardRowPill from '../../../shared/ui/DashboardRowPill';

/**
 * Native disclosure: top row is the action bar (leading + “How pools work”);
 * open content expands in normal flow below—no overlay or floating layer.
 *
 * @param {{ leading: React.ReactNode }} props
 */
export default function PoolsHowItWorksMenu({ leading }) {
  return (
    <details className="group w-full">
      <summary className="flex w-full cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 shrink">{leading}</div>
        <DashboardRowPill
          as="span"
          tone="muted"
          className="shrink-0 uppercase tracking-widest"
        >
          How pools work
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </DashboardRowPill>
      </summary>
      <div className="mt-2 rounded-xl border border-border-subtle bg-surface-glass px-3 py-3 shadow-inset-glass">
        <div className="space-y-3 text-sm font-medium leading-relaxed text-content-secondary">
          <p>
            A pool is a private group with one shared hub: active show, members,
            and pool-only standings.
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
      </div>
    </details>
  );
}
