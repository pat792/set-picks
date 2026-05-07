import React, { useCallback, useState } from 'react';
import { Bell, ChevronDown, Mail, Smartphone } from 'lucide-react';

import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import { useNotificationPrefs } from '../model/useNotificationPrefs';
import { usePushTokenRegistration } from '../model/usePushTokenRegistration';

function ChannelToggle({ description, disabled, checked, label, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border-muted/60 bg-surface-inset/40 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-black text-white">{label}</span>
        <span className="mt-1 block text-xs font-bold leading-relaxed text-content-secondary">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-border-muted text-brand-primary focus:ring-brand-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

/**
 * @param {{
 *   sectionId: string,
 *   title: string,
 *   summary?: string,
 *   leading?: React.ReactNode,
 *   open: boolean,
 *   onToggle: () => void,
 *   children: React.ReactNode,
 * }} props
 */
function NotificationAccordionSection({
  sectionId,
  title,
  summary = '',
  leading = null,
  open,
  onToggle,
  children,
}) {
  const headerId = `${sectionId}-header`;
  const panelId = `${sectionId}-panel`;

  return (
    <li className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-panel shadow-inset-glass">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel"
      >
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black uppercase tracking-widest text-content-secondary">
            {title}
          </span>
          {summary ? (
            <span className="mt-1 block text-xs font-bold leading-relaxed text-content-secondary">
              {summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-content-secondary transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-border-muted/80 px-5 pb-5 pt-2"
        >
          {children}
        </div>
      ) : null}
    </li>
  );
}

export default function NotificationsPrototypeScreen() {
  const [openSection, setOpenSection] = useState(null);

  const handleAccordion = useCallback((id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  const {
    enablePush,
    disablePush,
    errorMessage,
    permission,
    status,
    lastMessageTitle,
    triggerPushCanary,
    canaryStatus,
  } = usePushTokenRegistration();
  const {
    prefs,
    setField,
    isSaving: prefsSaving,
    error: prefsError,
  } = useNotificationPrefs();

  const pushStatusLabel = {
    idle: 'Off',
    working: 'Enabling...',
    enabled: 'On',
    denied: 'Blocked',
    unsupported: 'Unsupported',
    error: 'Error',
  }[status] ?? 'Off';
  const showUpcomingChannels = false;

  const pushLeading = (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10">
      <Smartphone className="h-5 w-5 text-brand-primary" aria-hidden />
    </span>
  );

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

      <ul className="mt-8 space-y-3">
        <NotificationAccordionSection
          sectionId="notif-push"
          title="Push notifications"
          summary={`Status: ${pushStatusLabel}. Tap to turn push on or off and send a test.`}
          leading={pushLeading}
          open={openSection === 'push'}
          onToggle={() => handleAccordion('push')}
        >
          <p className="text-sm font-bold leading-relaxed text-content-secondary">
            Get lock reminders, score updates, and recap drops on your phone. Add Setlist Pick
            &apos;Em to your home screen, then tap Enable and allow notifications.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              {pushStatusLabel}
            </span>
            <div className="flex flex-wrap items-center gap-2">
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
              {canaryStatus === 'sent' ? (
                <p className="mt-2 text-xs text-emerald-300">
                  Test notification sent. Check this device for the alert (including the system
                  notification tray if the app is in the background).
                </p>
              ) : null}
          {lastMessageTitle ? (
            <p className="mt-2 text-xs text-emerald-300">
              Foreground message received: <span className="font-bold">{lastMessageTitle}</span>
            </p>
          ) : null}
          {errorMessage ? <p className="mt-2 text-xs text-amber-300">{errorMessage}</p> : null}
        </NotificationAccordionSection>

        <NotificationAccordionSection
          sectionId="notif-categories"
          title="Push categories"
          summary="Reminders, wins & scores, and close calls — tap to adjust."
          open={openSection === 'categories'}
          onToggle={() => handleAccordion('categories')}
        >
          <p className="text-xs font-bold leading-relaxed text-content-secondary">
            Lock reminders, score / win alerts, and near-miss nudges default to on. Turn off any
            channel you do not want — we still respect browser permission and whether push is enabled
            in Push notifications.
          </p>
          <div className="mt-4 space-y-2">
            <ChannelToggle
              label="Lock reminders"
              description="Same-day nudge before picks lock in each show’s local timezone."
              checked={prefs.reminders}
              disabled={prefsSaving}
              onChange={(v) => setField('reminders', v)}
            />
            <ChannelToggle
              label="Wins & final scores"
              description="When a show is graded, including if you topped the night."
              checked={prefs.results}
              disabled={prefsSaving}
              onChange={(v) => setField('results', v)}
            />
            <ChannelToggle
              label="Close calls"
              description="When you finished within a couple points of the top score but did not win."
              checked={prefs.nearMiss}
              disabled={prefsSaving}
              onChange={(v) => setField('nearMiss', v)}
            />
          </div>
          {prefsError ? <p className="mt-3 text-xs text-amber-300">{prefsError}</p> : null}
        </NotificationAccordionSection>

        <NotificationAccordionSection
          sectionId="notif-privacy"
          title="Privacy & devices"
          summary="What we save on this device and how to turn alerts off."
          open={openSection === 'privacy'}
          onToggle={() => handleAccordion('privacy')}
        >
          <div className="space-y-3 text-sm font-bold leading-relaxed text-content-secondary">
            <p>
              When you turn on push, we save a small ID for this phone or browser so we can send the
              alerts you asked for. We also remember that you allowed notifications and a rough
              device type (for example, iPhone vs desktop) so delivery stays reliable.
            </p>
            <p>
              On iPhone, website alerts usually work best after you add Setlist Pick &apos;Em to your
              Home Screen and open it from there. Otherwise Apple may not show them.
            </p>
            <p>
              Turn off push above, change categories in this screen, or sign out to stop new alerts
              from reaching this device. If you join a pool later, a message might mention that pool
              by name so you know what it&apos;s about.
            </p>
          </div>
        </NotificationAccordionSection>

        {showUpcomingChannels ? (
          <NotificationAccordionSection
            sectionId="notif-email"
            title="Email"
            summary="Coming soon — tap for details."
            leading={
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-muted bg-surface-inset">
                <Mail className="h-5 w-5 text-content-secondary" aria-hidden />
              </span>
            }
            open={openSection === 'email'}
            onToggle={() => handleAccordion('email')}
          >
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
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
          </NotificationAccordionSection>
        ) : null}

        {showUpcomingChannels ? (
          <NotificationAccordionSection
            sectionId="notif-inapp"
            title="In-app"
            summary="Banners inside the app — tap for details."
            leading={
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-muted bg-surface-inset">
                <Bell className="h-5 w-5 text-content-secondary" aria-hidden />
              </span>
            }
            open={openSection === 'inapp'}
            onToggle={() => handleAccordion('inapp')}
          >
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              Banners and surfaces inside the dashboard (no extra permission).
            </p>
          </NotificationAccordionSection>
        ) : null}
      </ul>
    </div>
  );
}
