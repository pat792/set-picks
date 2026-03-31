import React from 'react';
import { Link } from 'react-router-dom';

import { PicksFieldsForm, PicksSubmitButton, usePicksForm } from '../../features/picks';

export default function PicksPage({ user, selectedDate }) {
  const {
    formData,
    handleInput,
    handleSave,
    isSaving,
    isLoadingPicks,
    isLocked,
    saveMessage,
  } = usePicksForm({ user, selectedDate });

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <div className="flex justify-end px-1 mb-3">
        <Link
          to="/dashboard/scoring"
          className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2"
        >
          Scoring rules
        </Link>
      </div>
      <div className="relative">
        <form
          onSubmit={handleSave}
          className={`space-y-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 transition-all duration-300 ${
            isLocked ? 'opacity-60' : ''
          }`}
        >
          <PicksFieldsForm
            formData={formData}
            onChange={handleInput}
            isLocked={isLocked}
            disabled={isLoadingPicks}
          />
          <PicksSubmitButton
            isSaving={isSaving}
            isLocked={isLocked}
            saveMessage={saveMessage}
          />
        </form>
      </div>
    </div>
  );
}
