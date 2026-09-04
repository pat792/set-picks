import React from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import SongAutocomplete from '../../../shared/ui/SongAutocomplete';
import { useSongCatalog } from '../../song-catalog';
import { artifactTargetsDate } from '../model/selectScorecardOdds';
import { useMakePicksOdds } from '../model/useMakePicksOdds';
import PicksOddsHint from './PicksOddsHint';

export default function PicksFieldsForm({
  formData,
  onChange,
  isLocked,
  disabled = false,
  selectedDate,
  pickRecommendationsArtifact,
}) {
  const { songs } = useSongCatalog();
  const getOddsLabel = useMakePicksOdds({
    selectedDate,
    artifact: pickRecommendationsArtifact,
  });
  const showOddsChrome = artifactTargetsDate(
    pickRecommendationsArtifact,
    selectedDate,
  );

  return (
    <>
      {showOddsChrome ? (
        <div className="-mt-1 mb-1 flex justify-end">
          <PicksOddsHint />
        </div>
      ) : null}
      {FORM_FIELDS.map((field) => (
        <div key={field.id} className="flex flex-col">
          <label className="mb-1 ml-1 text-xs font-bold uppercase tracking-widest text-content-secondary">
            {field.label}
          </label>
          <SongAutocomplete
            songs={songs}
            value={formData[field.id] || ''}
            onChange={(val) => onChange(field.id, val)}
            placeholder="Search and choose a song…"
            requireCatalogMatch
            excludeTitles={FORM_FIELDS.filter((f) => f.id !== field.id)
              .map((f) => formData[f.id])
              .filter(Boolean)}
            readOnly={isLocked}
            disabled={disabled || isLocked}
            getOddsLabel={getOddsLabel}
          />
        </div>
      ))}
    </>
  );
}
