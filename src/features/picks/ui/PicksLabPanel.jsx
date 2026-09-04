import React, { useCallback, useRef, useState } from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { showSuccessToast } from '../../../shared/ui/toast';
import { useShowCalendar } from '../../show-calendar';
import { isPredictionLabEnabled } from '../model/isPredictionLabEnabled';
import { usePickRecommendations } from '../model/usePickRecommendations';
import usePicksForm from '../model/usePicksForm';
import PickPredictionPanel from './PickPredictionPanel';
import PicksLabCardSummary from './PicksLabCardSummary';
import PicksLabComingSoon from './PicksLabComingSoon';

const JUST_APPLIED_MS = 2500;

/**
 * Picks Lab destination (#766): Prediction Lab when the env flag is on,
 * otherwise the always-visible coming-soon shell. Does not hide the tab.
 *
 * Prefer a cluster-owned `picksForm` so “Use” shares Make Picks card state.
 * Use writes the draft only — Lock / Update still persists.
 *
 * @param {{
 *   user: import('firebase/auth').User | null | undefined,
 *   selectedDate: string,
 *   picksForm?: ReturnType<typeof usePicksForm>,
 * }} props
 */
export default function PicksLabPanel({ user, selectedDate, picksForm: picksFormProp }) {
  const predictionLabEnabled = isPredictionLabEnabled();
  const { showDates, showDatesByTour } = useShowCalendar();
  const localForm = usePicksForm({
    user: picksFormProp || !predictionLabEnabled ? null : user,
    selectedDate: picksFormProp || !predictionLabEnabled ? '' : selectedDate,
    showDates,
    showDatesByTour,
  });
  const {
    formData,
    handleInput,
    handleSave,
    isSaving,
    isLoadingPicks,
    isLocked,
    isDirty,
    hadPersistedPicksOnServer,
    saveFeedback,
    pickConstraintMessage,
  } = picksFormProp ?? localForm;
  const {
    artifact: pickRecsArtifact,
    isLoading: pickRecsLoading,
    loadError: pickRecsError,
  } = usePickRecommendations();
  const cardRef = useRef(null);
  const [justAppliedSlotId, setJustAppliedSlotId] = useState(null);
  const justAppliedTimerRef = useRef(0);

  const onApplySong = useCallback(
    (fieldId, value) => {
      const prev = String(formData?.[fieldId] ?? '').trim();
      const next = String(value ?? '').trim();
      const accepted = handleInput(fieldId, value);
      if (accepted === false || !next) return;
      if (prev.toLowerCase() === next.toLowerCase()) return;

      setJustAppliedSlotId(fieldId);
      window.clearTimeout(justAppliedTimerRef.current);
      justAppliedTimerRef.current = window.setTimeout(() => {
        setJustAppliedSlotId(null);
      }, JUST_APPLIED_MS);

      const field = FORM_FIELDS.find((f) => f.id === fieldId);
      const slotLabel = field?.label ?? fieldId;
      showSuccessToast(
        `${next} added as ${slotLabel}. Lock picks to save.`,
      );
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [formData, handleInput],
  );

  if (!predictionLabEnabled) {
    return <PicksLabComingSoon />;
  }

  return (
    <div>
      {pickConstraintMessage ? (
        <div
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-100"
          role="status"
        >
          {pickConstraintMessage}
        </div>
      ) : null}
      {!isLoadingPicks ? (
        <>
          <div ref={cardRef}>
            <PicksLabCardSummary
              className="mb-4"
              formData={formData}
              justAppliedSlotId={justAppliedSlotId}
              isDirty={isDirty}
              hadPersistedPicksOnServer={hadPersistedPicksOnServer}
              isLocked={isLocked}
              isSaving={isSaving}
              saveFeedback={saveFeedback}
              onSave={handleSave}
            />
          </div>
          <PickPredictionPanel
            selectedDate={selectedDate}
            artifact={pickRecsArtifact}
            isLoading={pickRecsLoading}
            loadError={pickRecsError}
            formData={formData}
            isLocked={isLocked}
            onApplySong={onApplySong}
            slotInitKey={`${selectedDate}:${isLoadingPicks ? '1' : '0'}`}
          />
        </>
      ) : null}
    </div>
  );
}
