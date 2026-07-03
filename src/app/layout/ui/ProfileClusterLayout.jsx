import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import {
  NAV_LABEL_ACCOUNT,
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PROFILE,
} from '../../../shared/config/dashboardVocabulary';
import { PROFILE_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';

const SUB_NAV = [
  { to: PROFILE_CLUSTER_PATHS.profile, label: NAV_LABEL_PROFILE, end: true },
  { to: PROFILE_CLUSTER_PATHS.notifications, label: NAV_LABEL_MESSAGES, end: true },
  { to: PROFILE_CLUSTER_PATHS.account, label: NAV_LABEL_ACCOUNT, end: true },
];

/**
 * Persistent Profile-cluster sub-navigation (identity / messages / account).
 * Nested routes render via {@link Outlet}; `user` is passed through outlet context.
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function ProfileClusterLayout({ user }) {
  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <nav
        className="mb-6 flex gap-1 rounded-2xl border border-border-subtle/60 bg-surface-panel-strong p-1 shadow-inset-glass"
        aria-label="Profile sections"
      >
        {SUB_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex-1 rounded-xl px-2 py-2.5 text-center text-[11px] font-black uppercase tracking-widest transition-colors sm:text-xs',
                isActive
                  ? 'bg-brand-primary/15 text-brand-primary ring-1 ring-inset ring-brand-primary/35'
                  : 'text-content-secondary hover:bg-surface-inset hover:text-white',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ user }} />
    </div>
  );
}
