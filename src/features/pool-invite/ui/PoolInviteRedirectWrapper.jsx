import React from 'react';

import { usePoolInviteInterceptor } from '../model/usePoolInviteInterceptor';

export default function PoolInviteRedirectWrapper() {
  usePoolInviteInterceptor();

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-slate-900 px-4 text-center text-slate-300">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        aria-hidden
      />
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Opening invite…
      </p>
    </div>
  );
}
