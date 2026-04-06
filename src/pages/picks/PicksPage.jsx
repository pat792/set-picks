import React from 'react';
import { CheckCircle2, Lock, Scale } from 'lucide-react';

import { PicksFieldsForm, PicksSubmitButton, usePicksForm } from '../../features/picks';
import { useScoringRulesModal } from '../../features/scoring';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import GhostPill from '../../shared/ui/GhostPill';
export default function PicksPage({ user, selectedDate }) {
  const {
    formData,
    handleInput,
    handleSave,
    isSaving,
    isLoadingPicks,
    isLocked,
    hasExistingPicks,
    saveFeedback,
  } = usePicksForm({ user, selectedDate });

  const { openScoringRules } = useScoringRulesModal();

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <DashboardActionRow>
        <GhostPill icon={Scale} onClick={openScoringRules}>
          Scoring rules
        </GhostPill>
      </DashboardActionRow>
      <div className="relative">
        {!isLocked && hasExistingPicks ? (
          <div
            className="mb-4 flex items-center gap-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400"
            role="status"
          >
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-emerald-500"
              strokeWidth={2}
              aria-hidden
            />
            <span>
              Your picks are secured. You can edit them until showtime.
            </span>
          </div>
        ) : null}
        {isLocked ? (
          <div
            className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200/90"
            role="status"
          >
            <Lock className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
            <span>Picks are locked for this show.</span>
          </div>
        ) : null}
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
            hasExistingPicks={hasExistingPicks}
            saveFeedback={saveFeedback}
          />
        </form>
      </div>
    </div>
  );
}
