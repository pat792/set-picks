import React from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';

import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import { usePushTokenRegistration } from '../model/usePushTokenRegistration';

export default function NotificationsPrototypeScreen() {
  const {
    enablePush,
    disablePush,
    errorMessage,
    permission,
    status,
    lastMessageTitle,
    triggerPushCanary,
    canaryStatus,
    canaryMessageId,
  } = usePushTokenRegistration();

  const pushStatusLabel = {
    idle: 'Off',
    working: 'Enabling...',
    enabled: 'On',
    denied: 'Blocked',
    unsupported: 'Unsupported',
    error: 'Error',
  }[status] ?? 'Off';
  const showUpcomingChannels = false;

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <div className="mb-6 text-left">
        <h2
          className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
        >
          Notifications
        </h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-content-secondary md:mt-3">
          Choose how we reach you about shows, scores, and recaps.
        </p>
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
                Get lock reminders, score updates, and recap drops on your phone. Add Setlist Pick
                &apos;Em to your home screen, then tap Enable and allow notifications.
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  {pushStatusLabel}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={status === 'enabled' ? disablePush : enablePush}
                    disabled={status === 'working'}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      status === 'enabled'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-500 hover:bg-amber-500/20'
                        : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:border-brand-primary hover:bg-brand-primary/20'
                    }`}
                    aria-label={status === 'enabled' ? 'Disable push notifications' : 'Enable push notifications'}
                  >
                    {status === 'enabled' ? 'Disable' : status === 'working' ? 'Working...' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={triggerPushCanary}
                    disabled={status !== 'enabled' || canaryStatus === 'working'}
                    className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-brand-primary/50 hover:bg-surface-panel disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send test notification"
                  >
                    {canaryStatus === 'working' ? 'Sending...' : 'Send test notification'}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-content-secondary">
                Browser permission: <span className="font-bold text-white">{permission}</span>
              </p>
              {canaryStatus === 'sent' && canaryMessageId ? (
                <p className="mt-2 text-xs text-emerald-300">
                  Test notification sent ({canaryMessageId.slice(0, 16)}...)
                </p>
              ) : null}
              {lastMessageTitle ? (
                <p className="mt-2 text-xs text-emerald-300">
                  Foreground message received: <span className="font-bold">{lastMessageTitle}</span>
                </p>
              ) : null}
              {errorMessage ? (
                <p className="mt-2 text-xs text-amber-300">{errorMessage}</p>
              ) : null}
            </div>
          </div>
        </li>

        {showUpcomingChannels ? (
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
                  Teaser + CTA messages (e.g. tour recaps) tied to your account email.
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 opacity-60">
                  <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Off
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
        ) : null}

        {showUpcomingChannels ? (
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
                  Banners and surfaces inside the dashboard (no extra permission).
                </p>
              </div>
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
