import React from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import SongAutocomplete from '../../../shared/ui/SongAutocomplete';

export default function PicksFieldsForm({
  formData,
  onChange,
  isLocked,
  disabled = false,
}) {
  return (
    <>
      {FORM_FIELDS.map((field) => (
        <div key={field.id} className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
            {field.label}
          </label>
          <SongAutocomplete
            value={formData[field.id] || ''}
            onChange={(val) => onChange(field.id, val)}
            placeholder="Type a song..."
            readOnly={isLocked}
            disabled={disabled}
          />
        </div>
      ))}
    </>
  );
}
