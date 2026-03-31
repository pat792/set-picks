import React from 'react';

import Button from '../../../shared/ui/Button';

/**
 * Editable profile fields (handle, favorite song) for the signed-in user.
 */
export default function ProfileEditForm({
  handle,
  favoriteSong,
  onHandleChange,
  onFavoriteSongChange,
  onSave,
  isSaving,
  isLoading = false,
  message,
}) {
  return (
    <form
      onSubmit={onSave}
      className="space-y-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50"
    >
      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
          Display Name / Handle
        </label>
        <input
          type="text"
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          placeholder="e.g., CactusMike99"
          disabled={isLoading}
          className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full disabled:opacity-50"
        />
        <p className="text-[10px] text-slate-500 mt-1 ml-1">
          This is how you will appear on the Leaderboard and in Pools.
        </p>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
          Favorite Phish Song
        </label>
        <input
          type="text"
          value={favoriteSong}
          onChange={(e) => onFavoriteSongChange(e.target.value)}
          placeholder="e.g., You Enjoy Myself"
          disabled={isLoading}
          className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full disabled:opacity-50"
        />
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          type="submit"
          disabled={isSaving || isLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-lg py-4 rounded-xl uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20"
        >
          {isSaving ? 'Saving...' : 'Update Profile'}
        </Button>
      </div>

      {message.text && (
        <div
          className={`text-center font-bold text-sm mt-4 ${
            message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
