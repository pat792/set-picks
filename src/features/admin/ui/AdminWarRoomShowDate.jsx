import React from 'react';
import { CalendarRange } from 'lucide-react';

/**
 * Admin-only: pick the Firestore `official_setlists/{showDate}` key independently of the
 * global dashboard tour picker (which may omit past legs or reset to “next show”).
 *
 * @param {{ value: string, onChange: (ymd: string) => void, disabled?: boolean }} props
 */
export default function AdminWarRoomShowDate({ value, onChange, disabled = false }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-[rgb(var(--surface-field)_/_0.35)] px-4 py-3 ring-1 ring-border-glass/20">
      <div className="flex items-start gap-2">
        <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor="admin-war-room-show-date"
            className="block text-xs font-bold uppercase tracking-widest text-content-secondary"
          >
            War Room show date
          </label>
          <p className="text-[11px] font-bold leading-relaxed text-content-secondary">
            Choose the Phish <code className="text-slate-400">YYYY-MM-DD</code> you are editing or
            polling. This can differ from the global “Tour Date” list (e.g. Mexico or test dates).
          </p>
          <input
            id="admin-war-room-show-date"
            type="date"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 w-full max-w-[14rem] rounded-xl border-2 border-border-subtle bg-surface-field px-3 py-2 text-sm font-bold text-content-primary outline-none focus:border-brand-primary disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
