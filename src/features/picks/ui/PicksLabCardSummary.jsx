import React from 'react';
import { ListMusic } from 'lucide-react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';
import PicksSubmitButton from './PicksSubmitButton';

export const PICKS_LAB_CARD_TITLE = 'Your card';
export const PICKS_LAB_CARD_EMPTY_HINT =
  'Use a recommendation to fill a slot.';
export const PICKS_LAB_CARD_DRAFT_HINT =
  'On your card — not saved yet. Lock picks to keep them.';
export const PICKS_LAB_CARD_UPDATE_HINT =
  'Changed on your card — Update Picks to save.';
export const PICKS_LAB_CARD_SAVED_HINT =
  'Saved. You can still change them until showtime.';

function statusHint({ hasAnyPick, isDirty, hadPersistedPicksOnServer, isLocked }) {
  if (isLocked) return null;
  if (!hasAnyPick) return PICKS_LAB_CARD_EMPTY_HINT;
  if (isDirty && hadPersistedPicksOnServer) return PICKS_LAB_CARD_UPDATE_HINT;
  if (isDirty) return PICKS_LAB_CARD_DRAFT_HINT;
  return PICKS_LAB_CARD_SAVED_HINT;
}

/**
 * Live My Picks card on Picks Lab. Use writes the shared draft only;
 * Lock / Update still persists.
 *
 * @param {{
 *   formData?: Record<string, string>,
 *   justAppliedSlotId?: string | null,
 *   isDirty?: boolean,
 *   hadPersistedPicksOnServer?: boolean,
 *   isLocked?: boolean,
 *   isSaving?: boolean,
 *   saveFeedback?: { tone?: string, variant?: string, text?: string } | null,
 *   onSave?: (e?: unknown) => void,
 *   className?: string,
 * }} props
 */
export default function PicksLabCardSummary({
  formData = {},
  justAppliedSlotId = null,
  isDirty = false,
  hadPersistedPicksOnServer = false,
  isLocked = false,
  isSaving = false,
  saveFeedback = null,
  onSave,
  className = '',
}) {
  const hasAnyPick = FORM_FIELDS.some((f) =>
    String(formData?.[f.id] ?? '').trim(),
  );
  const hint = statusHint({
    hasAnyPick,
    isDirty,
    hadPersistedPicksOnServer,
    isLocked,
  });
  const showSave = Boolean(onSave) && isDirty && !isLocked;

  return (
    <section
      className={`flex flex-col ${DASHBOARD_CARD_RADIUS} border border-brand-primary/30 bg-surface-panel/80 ${DASHBOARD_CARD_PAD} ${className}`}
      aria-label="Your card"
    >
      <p
        className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary`}
      >
        <ListMusic className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
        My picks
      </p>
      <p className={`mt-0.5 ${DASHBOARD_CARD_TITLE}`}>{PICKS_LAB_CARD_TITLE}</p>
      {hint ? (
        <p className={`mt-0.5 ${DASHBOARD_CARD_BODY}`} role="status">
          {hint}
        </p>
      ) : null}

      <ul className="mt-3 space-y-1.5">
        {FORM_FIELDS.map((field) => {
          const song = String(formData?.[field.id] ?? '').trim();
          const justApplied = field.id === justAppliedSlotId;
          return (
            <li
              key={field.id}
              className={`flex items-baseline justify-between gap-3 rounded-lg border px-2.5 py-1.5 ${
                justApplied
                  ? 'border-brand-primary/55 bg-brand-primary/15'
                  : 'border-border-subtle/80 bg-surface-elevated/25'
              }`}
            >
              <span className={`shrink-0 ${DASHBOARD_CARD_EYEBROW} text-content-secondary`}>
                {field.label}
              </span>
              <span
                className={`min-w-0 truncate text-right text-sm font-bold ${
                  song ? 'text-white' : 'text-content-secondary/70'
                }`}
              >
                {song || '—'}
              </span>
            </li>
          );
        })}
      </ul>

      {showSave ? (
        <form onSubmit={onSave} className="mt-1">
          <PicksSubmitButton
            isSaving={isSaving}
            isLocked={isLocked}
            hasExistingPicks={hadPersistedPicksOnServer}
            saveFeedback={saveFeedback}
          />
        </form>
      ) : saveFeedback?.text ? (
        <p
          className={`mt-3 text-center text-sm font-bold ${
            saveFeedback.tone === 'error' ? 'text-red-400' : 'text-emerald-400'
          }`}
          role="status"
        >
          {saveFeedback.text}
        </p>
      ) : null}
    </section>
  );
}
