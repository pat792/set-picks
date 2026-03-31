import React from 'react';

import StatusBanner from './StatusBanner';

export default function AsyncStatus({ isLoading, error, loadingText = 'Loading...', children }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-200">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-400"
          aria-hidden
        />
        <p className="text-sm font-bold text-emerald-400">{loadingText}</p>
      </div>
    );
  }

  if (error) {
    const message = typeof error === 'string' ? error : error?.message || 'Something went wrong.';
    return <StatusBanner type="error" message={message} />;
  }

  return <>{children}</>;
}
