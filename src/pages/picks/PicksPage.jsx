import React, { useEffect, useId, useState } from 'react';
import { CheckCircle2, ChevronDown, Lock, Scale } from 'lucide-react';

import { PicksFieldsForm, PicksSubmitButton, usePicksForm } from '../../features/picks';
import { useShowCalendar } from '../../features/show-calendar';
import { useScoringRulesModal } from '../../features/scoring';
import Card from '../../shared/ui/Card';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import GhostPill from '../../shared/ui/GhostPill';
export default function PicksPage({ user, selectedDate }) {
  const { showDates, showDatesByTour } = useShowCalendar();
  const {
    formData,
    handleInput,
    handleSave,
    isSaving,
    isLoadingPicks,
    isLocked,
    hasExistingPicks,
    saveFeedback,
    pickConstraintMessage,
  } = usePicksForm({ user, selectedDate, showDates, showDatesByTour });

  const { openScoringRules } = useScoringRulesModal();
  const statusContentId = useId();

  const shouldShowSavedStatus = !isLocked && hasExistingPicks;
  const shouldShowLockedStatus = isLocked;
  const shouldShowStatus = shouldShowSavedStatus || shouldShowLockedStatus;

  const [isMobileStatusExpanded, setIsMobileStatusExpanded] = useState(() => shouldShowLockedStatus);

  useEffect(() => {
    setIsMobileStatusExpanded(shouldShowLockedStatus);
  }, [shouldShowLockedStatus, shouldShowSavedStatus]);

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <DashboardActionRow>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <GhostPill icon={Scale} onClick={openScoringRules}>
            Scoring rules
          </GhostPill>
          {shouldShowStatus ? (
            <GhostPill
              type="button"
              icon={shouldShowLockedStatus ? Lock : CheckCircle2}
              className={[
                'md:hidden',
                shouldShowLockedStatus
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-200/90 hover:border-amber-500/45 hover:bg-amber-500/15 hover:text-amber-100'
                  : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:border-brand-primary/55 hover:bg-brand-primary/15 hover:text-brand-primary',
              ].join(' ')}
              aria-expanded={isMobileStatusExpanded}
              aria-controls={statusContentId}
              onClick={() => setIsMobileStatusExpanded((prev) => !prev)}
            >
              <span className="flex items-center gap-1">
                {shouldShowLockedStatus ? 'Picks locked' : 'Picks saved'}
                <ChevronDown
                  className={[
                    'h-3.5 w-3.5 shrink-0 transition-transform',
                    isMobileStatusExpanded ? 'rotate-180' : '',
                  ].join(' ')}
                  aria-hidden
                />
              </span>
            </GhostPill>
          ) : null}
        </div>
      </DashboardActionRow>
      <div className="relative">
        {shouldShowStatus ? (
          <>
            <div id={statusContentId} className={isMobileStatusExpanded ? 'md:block' : 'hidden md:block'}>
              {shouldShowSavedStatus ? (
                <div
                  className="mb-4 flex items-center gap-2.5 rounded-md border border-brand-primary/40 bg-brand-primary/10 p-3 text-sm text-brand-primary"
                  role="status"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-brand-primary"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>
                    Your picks are secured. You can edit them until showtime.
                  </span>
                </div>
              ) : null}
              {shouldShowLockedStatus ? (
                <div
                  className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200/90"
                  role="status"
                >
                  <Lock className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                  <span>Picks are locked for this show.</span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        <Card
          as="form"
          onSubmit={handleSave}
          variant="venue"
          className="space-y-4 transition-all duration-300"
        >
          {pickConstraintMessage ? (
            <div
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-100"
              role="status"
            >
              {pickConstraintMessage}
            </div>
          ) : null}
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
        </Card>
      </div>
    </div>
  );
}
