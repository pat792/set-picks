import React from 'react';

import Card from '../../../shared/ui/Card';
import PageTitle from '../../../shared/ui/PageTitle';
import TourStandingsSection from './TourStandingsSection';

/**
 * Standings tour-view composition. Renders either an empty state (no
 * tour scheduled yet) or the tour-standings section. Pure presentational
 * — all state comes from `useStandingsScreen`.
 */
export default function StandingsTourView({
  tourName,
  leaders,
  loading,
  error,
  hasCurrentTour,
}) {
  if (!hasCurrentTour) {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <PageTitle as="h2" variant="section" className="mb-2">
          No tour in progress
        </PageTitle>
        <p className="mx-auto max-w-sm font-bold leading-relaxed text-content-secondary">
          Tour standings will appear once the current tour&apos;s schedule is
          published.
        </p>
      </Card>
    );
  }
  return (
    <TourStandingsSection
      tourName={tourName}
      leaders={leaders}
      loading={loading}
      error={error}
    />
  );
}
