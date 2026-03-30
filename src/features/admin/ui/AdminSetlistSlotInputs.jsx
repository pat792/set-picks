import React from 'react';
import SongAutocomplete from '../../../shared/ui/SongAutocomplete';
import { ADMIN_SETLIST_FIELDS } from '../model/useAdminSetlistForm';

export default function AdminSetlistSlotInputs({
  formState,
  handleInputChange,
  fields = ADMIN_SETLIST_FIELDS,
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Official {field.label}
          </label>
          <SongAutocomplete
            value={formState[field.id] || ''}
            onChange={(value) => handleInputChange(field.id, value)}
            placeholder={`e.g., ${field.placeholder || 'Song Name'}`}
          />
        </div>
      ))}
    </div>
  );
}
