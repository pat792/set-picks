import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Download, Share2 } from 'lucide-react';

import { ga4Event } from '../../../shared/lib/ga4';
import { useDashboardPushNudge } from '../model/useDashboardPushNudge';
import { useInstallPrompt } from '../model/useInstallPrompt';

/**
 * Routes where the compact install + push nudge may appear (#334). Profile keeps
 * the full `InstallAppCard`; pool detail and settings routes stay focused.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function dashboardRouteShowsInstallEngage(pathname) {
  const n = pathname.replace(/\/$/, '') || '/dashboard';
  if (
    n === '/dashboard/profile' ||
    n === '/dashboard/account-security' ||
    n === '/dashboard/notifications' ||
    n === '/dashboard/admin'
  ) {
    return false;
  }
  if (n.startsWith('/dashboard/pool/')) return false;
  return (
    n === '/dashboard' ||
    n === '/dashboard/picks' ||
    n === '/dashboard/standings' ||
    n === '/dashboard/pools'
  );
}

/**
 * Inner component: only mounts on routes where the banner may show, so
 * `useInstallPrompt` is not duplicated with `InstallAppCard` on Profile (#334).
 *
 * @param {{ userId: string | null | undefined }} props
 */
function DashboardInstallEngageBannerLoaded({ userId }) {
  const install = useInstallPrompt();
  const push = useDashboardPushNudge({
    userId,
    isInstalled: install.isInstalled,
  });

  const showInstall = install.shouldShowDashboardInstallBanner;
  const showPush = push.shouldShowPushNudge;

  if (!showInstall && !showPush) return null;

  return (
    <div className="mb-4 space-y-2 md:mb-5">
      {showInstall ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-panel px-4 py-3 shadow-inset-glass md:px-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary">
            Faster launch &amp; full screen
          </p>
          <p className="mt-1 text-xs font-bold leading-snug text-content-secondary">
            Add Setlist Pick &apos;Em to your home screen for quick access on show night.
          </p>

          {install.canPrompt ? (
            <button
              type="button"
              onClick={() => install.promptInstall()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-primary/45 bg-brand-primary/10 py-2.5 text-xs font-black uppercase tracking-widest text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-primary/20"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Add to Home Screen
            </button>
          ) : null}

          {install.shouldShowIosFlow ? (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() =>
                  install.showIosGuide ? install.closeIosGuide() : install.openIosGuide()
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border-subtle bg-surface-field py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-brand-primary/50 hover:bg-surface-panel"
              >
                <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                {install.showIosGuide ? 'Hide steps' : 'iPhone: Add to Home Screen'}
              </button>
              {install.showIosGuide ? (
                <ol className="space-y-1.5 rounded-xl border border-border-muted bg-surface-inset p-3 text-xs text-content-secondary">
                  <li>
                    1. Tap <span className="font-bold text-white">Share</span> in Safari.
                  </li>
                  <li>
                    2. Tap <span className="font-bold text-white">Add to Home Screen</span>.
                  </li>
                  <li>
                    3. Tap <span className="font-bold text-white">Add</span>.
                  </li>
                </ol>
              ) : null}
              <button
                type="button"
                onClick={() => install.dismissIos()}
                className="text-[11px] font-black uppercase tracking-widest text-content-secondary underline decoration-border-muted underline-offset-4 hover:text-white"
              >
                Don&apos;t show again
              </button>
            </div>
          ) : null}

          {install.shouldShowIosNonSafariFlow ? (
            <div className="mt-3 space-y-2">
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs font-bold leading-relaxed text-content-secondary">
                On iPhone, <span className="text-white">Chrome and other browsers can&apos;t install</span> this
                app. Open <span className="text-white">setlistpickem.com</span> in{' '}
                <span className="text-white">Safari</span>, then use Share → Add to Home Screen.
              </p>
              <button
                type="button"
                onClick={() => install.dismissIos()}
                className="text-[11px] font-black uppercase tracking-widest text-content-secondary underline decoration-border-muted underline-offset-4 hover:text-white"
              >
                Don&apos;t show again
              </button>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 border-t border-border-muted/60 pt-3">
            <button
              type="button"
              onClick={() => install.snoozeInstallDashboard(7)}
              className="text-[11px] font-black uppercase tracking-widest text-content-secondary hover:text-white"
            >
              Not now · ask again in 7 days
            </button>
          </div>
        </div>
      ) : null}

      {showPush ? (
        <div className="rounded-2xl border border-brand-primary/35 bg-brand-primary/[0.07] px-4 py-3 md:px-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary">
            {push.highlightAfterInstall ? "You're set up — one more tap" : 'Stay in the loop'}
          </p>
          <p className="mt-1 text-xs font-bold text-content-secondary">
            {push.highlightAfterInstall
              ? 'Turn on alerts for lock reminders and score updates (your browser will ask permission once).'
              : 'Get lock reminders and score alerts on this device.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/notifications?openPush=1"
              onClick={() => {
                ga4Event('push_nudge_cta_clicked', { surface: 'dashboard' });
                push.clearSessionInstallFlag();
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-primary/50 bg-brand-primary/15 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-primary/25 min-[400px]:flex-none"
            >
              <Bell className="h-4 w-4 shrink-0" aria-hidden />
              Turn on alerts
            </Link>
            <button
              type="button"
              onClick={() => push.dismissPushNudge()}
              className="rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest text-content-secondary hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * @param {{ userId: string | null | undefined, pathname: string }} props
 */
export default function DashboardInstallEngageBanner({ userId, pathname }) {
  if (!dashboardRouteShowsInstallEngage(pathname)) return null;
  return <DashboardInstallEngageBannerLoaded userId={userId} />;
}
