import React from 'react';

import Card from '../../../shared/ui/Card';

export default function StandingsBannerWaitingSetlist() {
  return (
    <Card variant="alert" padding="sm" className="mb-6 text-center">
      <p className="text-amber-400 font-bold text-sm">Waiting for official setlist. Stay tuned...</p>
    </Card>
  );
}
