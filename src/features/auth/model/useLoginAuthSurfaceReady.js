import { useEffect, useState } from 'react';

import {
  isLoginAuthSurfaceReady,
  subscribeLoginAuthSurfaceReady,
} from './warmLoginAuthSurface';

/**
 * Google CTA gate for `/login` (#858) — false until Auth + click modules ready.
 * @returns {boolean}
 */
export function useLoginAuthSurfaceReady() {
  const [ready, setReady] = useState(() => isLoginAuthSurfaceReady());

  useEffect(() => {
    if (isLoginAuthSurfaceReady()) {
      setReady(true);
      return undefined;
    }
    return subscribeLoginAuthSurfaceReady(() => {
      setReady(true);
    });
  }, []);

  return ready;
}
