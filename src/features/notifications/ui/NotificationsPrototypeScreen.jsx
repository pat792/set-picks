import React from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';

import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';

/**
 * Lean placeholder for `/dashboard/notifications` (Option B — dedicated route).
 * Replace with real preferences + inbox when #273–#274 land; keep this file as the
 * primary presentational shell and add `model/` + `api/` without renaming the route.
 */
export default function NotificationsPrototypeScreen() {
  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <div className="mb-6 text-left">
        <h2
          className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
        >
          Notifications
        </h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-content-secondary md:mt-3">
          Choose how we reach you about shows, scores, and recaps. This page is a{' '}
          <span className="text-white">prototype shell</span> — toggles are visual only until web push
          and saved preferences ship (epic #272 / #274).
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm font-bold leading-relaxed text-amber-100/95">
        Product + eng can reshape this layout freely: add an inbox list, channel sections, or move
        copy into <code className="rounded bg-black/20 px-1 py-0.5 text-xs">content/comms</code> for
        non-coder edits. The stable contract is the route <code className="text-xs">/dashboard/notifications</code>{' '}
        and the <code className="text-xs">notifications</code> feature folder.
      </div>

      <ul className="mt-8 space-y-4">
        <li className="rounded-3xl border border-border-subtle bg-surface-panel p-5 shadow-inset-glass">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10">
              <Smartphone className="h-5 w-5 text-brand-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
                Push notifications
              </h3>
              <p className="mt-1 text-sm font-bold leading-relaxed text-content-secondary">
                Alerts after scores finalize, reminders before lock, and recap drops. Requires browser
                permission and our service worker rollout.
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 opacity-60">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Off (prototype)
                </span>
                <button
                  type="button"
                  disabled
                  className="relative h-8 w-14 shrink-0 rounded-full bg-surface-inset ring-1 ring-border-muted"
                  aria-label="Push notifications — coming soon"
                >
                  <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-content-secondary/40" />
                </button>
              </div>
            </div>
          </div>
        </li>

        <li className="rounded-3xl border border-border-subtle bg-surface-panel p-5 shadow-inset-glass">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-muted bg-surface-inset">
              <Mail className="h-5 w-5 text-content-secondary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
                Email
              </h3>
              <p className="mt-1 text-sm font-bold leading-relaxed text-content-secondary">
                Teaser + CTA messages (e.g. tour recaps) tied to your account email. Fine-grained
                categories can land here later.
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 opacity-60">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Off (prototype)
                </span>
                <button
                  type="button"
                  disabled
                  className="relative h-8 w-14 shrink-0 rounded-full bg-surface-inset ring-1 ring-border-muted"
                  aria-label="Email notifications — coming soon"
                >
                  <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-content-secondary/40" />
                </button>
              </div>
            </div>
          </div>
        </li>

        <li className="rounded-3xl border border-border-subtle bg-surface-panel p-5 shadow-inset-glass">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-muted bg-surface-inset">
              <Bell className="h-5 w-5 text-content-secondary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
                In-app
              </h3>
              <p className="mt-1 text-sm font-bold leading-relaxed text-content-secondary">
                Banners and surfaces inside the dashboard (no extra permission). Message history or a
                bell entry point can attach here later.
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
