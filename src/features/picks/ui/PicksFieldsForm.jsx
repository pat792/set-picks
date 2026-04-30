import React from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import SongAutocomplete from '../../../shared/ui/SongAutocomplete';
import { useSongCatalog } from '../../song-catalog';

export default function PicksFieldsForm({
  formData,
  onChange,
  isLocked,
  disabled = false,
}) {
  const { songs } = useSongCatalog();

  return (
    <>
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
          />
        </div>
      ))}
    </>
  );
}
