import React from 'react';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';

export default function ProfileSetupForm({
  handle,
  onHandleChange,
  favoriteSong,
  onFavoriteSongChange,
  onSubmit,
  isSaving,
  error,
}) {
  const canSubmit = !isSaving && handle.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col text-left gap-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">
          Username / Handle *
        </label>
        <Input
          type="text"
          placeholder="e.g. LawnBoy99"
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          className="rounded-2xl p-4 text-lg text-white border-slate-700"
          maxLength={20}
          required
        />
      </div>

      <div className="flex flex-col text-left gap-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">
          Favorite Song (Optional)
        </label>
        <Input
          type="text"
          placeholder="e.g. You Enjoy Myself"
          value={favoriteSong}
          onChange={(e) => onFavoriteSongChange(e.target.value)}
          className="rounded-2xl p-4 text-lg text-white border-slate-700 focus:border-blue-500"
        />
      </div>

      {error ? (
        <p className="text-red-400 text-xs font-bold uppercase">{error}</p>
      ) : null}

      <Button
        variant="primary"
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-green-400 hover:bg-green-300 text-green-950 p-4 uppercase tracking-widest shadow-[0_0_15px_rgba(74,222,128,0.4)] hover:scale-[1.02] mt-4"
      >
        {isSaving ? 'Saving...' : 'Lock Profile In'}
      </Button>
    </form>
  );
}
