import { useEffect } from 'react';

import { scheduleSpeculativeLoginWarm } from './prefetchLoginIntent';

/**
 * Post-paint idle download-warm for marketing → `/login` (#880 / T2.5 Phase A).
 * Download only — no `initializeApp` on marketing.
 */
export default function useSpeculativeLoginWarm() {
  useEffect(() => scheduleSpeculativeLoginWarm(), []);
}
