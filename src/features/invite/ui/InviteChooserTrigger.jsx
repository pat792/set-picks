import React from 'react';
import { UserPlus } from 'lucide-react';

const VARIANT_CLASS = {
  /** Always-on chrome — GhostPill shape + brand tint (not solid teal view pills). */
  utility:
    'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold font-sans text-brand-primary transition-colors hover:border-brand-primary/55 hover:bg-brand-primary/15 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
  /** High-intent board moments (empty states) — same tint language, slightly larger. */
  emphasis:
    'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-primary/45 bg-brand-primary/15 px-3 py-1.5 text-sm font-bold font-sans text-brand-primary transition-colors hover:border-brand-primary/55 hover:bg-brand-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
};

/**
 * Standings Invite control — opens the chooser sheet (never auto-shares).
 *
 * @param {{
 *   onClick: () => void,
 *   className?: string,
 *   variant?: 'utility' | 'emphasis',
 *   label?: string,
 * }} props
 */
export default function InviteChooserTrigger({
  onClick,
  className = '',
  variant = 'utility',
  label = 'Invite friends',
}) {
  const resolved = VARIANT_CLASS[variant] || VARIANT_CLASS.utility;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[resolved, className].filter(Boolean).join(' ')}
    >
      <UserPlus
        className={variant === 'emphasis' ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'}
        aria-hidden
      />
      <span>{label}</span>
    </button>
  );
}
