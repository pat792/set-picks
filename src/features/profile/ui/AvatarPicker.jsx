import React from 'react';

import { FeatureNewBadge } from '../../feature-discovery';
import { PROFILE_AVATARS } from '../model/avatarCatalog';
import ProfileAvatar from './ProfileAvatar';

/**
 * Curated avatar picker grid (#567).
 *
 * @param {{
 *   value: string,
 *   onChange: (avatarId: string) => void,
 *   disabled?: boolean,
 *   showNewBadge?: boolean,
 * }} props
 */
export default function AvatarPicker({
  value,
  onChange,
  disabled = false,
  showNewBadge = false,
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 ml-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        Avatar
        {showNewBadge ? <FeatureNewBadge title="New: profile avatars" /> : null}
      </legend>
      <div className="mb-3 flex items-center gap-3">
        <ProfileAvatar avatarId={value} size="lg" />
        <p className="text-[11px] font-medium leading-relaxed text-content-secondary">
          Pick a mark for your Profile and public page. No uploads — curated
          set only.
        </p>
      </div>
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-6"
        role="radiogroup"
        aria-label="Choose avatar"
      >
        {PROFILE_AVATARS.map((avatar) => {
          const selected = value === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={avatar.label}
              disabled={disabled}
              onClick={() => onChange(avatar.id)}
              className={`rounded-2xl p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                selected
                  ? 'bg-brand-primary/20 ring-2 ring-brand-primary'
                  : 'hover:bg-surface-field'
              }`}
            >
              <ProfileAvatar avatarId={avatar.id} size="sm" alt="" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
