import React from 'react';
import { NavLink } from 'react-router-dom';

const trayClass =
  'flex w-full min-w-0 gap-1 rounded-xl border border-border-subtle/60 bg-surface-panel-strong p-1 shadow-inset-glass';

const segmentBase =
  'relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

const segmentActive =
  'bg-brand-primary/15 text-brand-primary ring-1 ring-inset ring-brand-primary/35';

const segmentInactive =
  'text-content-secondary hover:bg-surface-inset hover:text-white';

/**
 * Boxed segmented control for mobile dashboard chrome (#609).
 * One tray, equal-width segments — used for mutual-exclusive IA (views, sections).
 *
 * @param {{
 *   ariaLabel: string,
 *   className?: string,
 *   value?: string,
 *   onChange?: (id: string) => void,
 *   items: Array<{
 *     id?: string,
 *     to?: string,
 *     end?: boolean,
 *     label: string,
 *     icon?: React.ComponentType<{ className?: string, 'aria-hidden'?: boolean }>,
 *     badge?: React.ReactNode,
 *   }>,
 * }} props
 */
export default function ChromeSegmentedControl({
  ariaLabel,
  className = '',
  value,
  onChange,
  items,
}) {
  const isNav = items.some((item) => item.to != null);

  if (isNav) {
    return (
      <nav
        className={[trayClass, className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      >
        {items.map(({ to, label, end, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [segmentBase, isActive ? segmentActive : segmentInactive].join(' ')
            }
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
            <span className="truncate">{label}</span>
            {badge}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[trayClass, className].filter(Boolean).join(' ')}
    >
      {items.map(({ id, label, icon: Icon, badge }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(id)}
            className={[segmentBase, selected ? segmentActive : segmentInactive].join(' ')}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
            <span className="truncate">{label}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}
