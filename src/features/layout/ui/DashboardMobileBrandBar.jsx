import React from 'react';

export default function DashboardMobileBrandBar({ user }) {
  return (
    <div className="relative z-20 min-h-16 py-2.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 gap-3">
      <h1 className="font-display min-w-0 flex-1 text-display-brand-bar font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 leading-none">
        SETLIST PICK 'EM
      </h1>
      <div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs">
        {user?.email?.charAt(0).toUpperCase() || '👤'}
      </div>
    </div>
  );
}

