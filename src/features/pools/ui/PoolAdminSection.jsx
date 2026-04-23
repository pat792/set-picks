import React from 'react';
import { ChevronDown } from 'lucide-react';

import PoolAdminControls from './PoolAdminControls';

/**
 * Collapsed-by-default owner-only disclosure that wraps {@link PoolAdminControls}.
 *
 * Mirrors the `<details>` pattern used by `PoolHubShowArchive` and
 * `PoolHubStandingsSection`, keeping the amber "admin zone" accent so the
 * section still reads as a destructive-capable surface even when collapsed.
 *
 * Accessibility: native `<details>`/`<summary>` handles keyboard toggle + focus.
 * The portaled `ConfirmationModal` inside `PoolAdminControls` renders above the
 * page chrome, so opening a confirm dialog does not change disclosure state.
 */
export default function PoolAdminSection(props) {
  if (!props.canAdmin) return null;

  return (
    <section>
      <details className="group rounded-xl border border-amber-500/25 bg-amber-500/5 shadow-inset-glass">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-bold text-amber-200/90 transition-colors hover:text-amber-100 [&::-webkit-details-marker]:hidden">
          <span className="uppercase tracking-widest">
            Pool admin
            <span className="ml-2 text-[0.65rem] font-medium normal-case tracking-normal text-amber-200/60">
              Owner controls
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="border-t border-amber-500/20 px-4 py-3">
          <PoolAdminControls {...props} />
        </div>
      </details>
    </section>
  );
}
