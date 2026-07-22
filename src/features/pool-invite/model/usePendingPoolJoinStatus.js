import { useEffect, useState } from 'react';

import {
  getPendingPoolJoinStatus,
  subscribePendingPoolJoinStatus,
} from './pendingPoolJoinStatus';

/**
 * Subscribe to deferred invite-join status for honest pools chrome (#728).
 */
export function usePendingPoolJoinStatus() {
  const [status, setStatus] = useState(getPendingPoolJoinStatus);

  useEffect(() => subscribePendingPoolJoinStatus(setStatus), []);

  return status;
}
