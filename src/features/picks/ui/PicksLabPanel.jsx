import React from 'react';

import { useShowCalendar } from '../../show-calendar';
import { isPredictionLabEnabled } from '../model/isPredictionLabEnabled';
import { usePickRecommendations } from '../model/usePickRecommendations';
import usePicksForm from '../model/usePicksForm';
import PickPredictionPanel from './PickPredictionPanel';
import PicksLabComingSoon from './PicksLabComingSoon';

/**
 * Picks Lab destination (#766): Prediction Lab when the env flag is on,
 * otherwise the always-visible coming-soon shell. Does not hide the tab.
 *
 * Prefer a cluster-owned `picksForm` so “Use” shares Make Picks card state.
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
    isLoadingPicks,
    isLocked,
    pickConstraintMessage,
  } = picksFormProp ?? localForm;
  const {
    artifact: pickRecsArtifact,
    isLoading: pickRecsLoading,
    loadError: pickRecsError,
  } = usePickRecommendations();

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
        <PickPredictionPanel
          selectedDate={selectedDate}
          artifact={pickRecsArtifact}
          isLoading={pickRecsLoading}
          loadError={pickRecsError}
          formData={formData}
          isLocked={isLocked}
          onApplySong={handleInput}
        />
      ) : null}
    </div>
  );
}
