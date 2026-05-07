import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

import { useCommsInbox } from '../model/commsInboxContext.jsx';

/**
 * Header/sidebar affordance for `/dashboard/notifications` with unread badge.
 */
export default function DashboardNotificationsBell() {
  const { unreadCount, ready } = useCommsInbox();

  const label =
    unreadCount > 0
      ? `Notifications — ${unreadCount} unread`
      : 'Notifications';

  return (
    <Link
      to="/dashboard/notifications"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle/60 bg-surface-panel-strong text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      aria-label={label}
    >
      <Bell className="h-5 w-5" aria-hidden />
      {ready && unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-black leading-none text-[rgb(var(--brand-bg-deep))]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
