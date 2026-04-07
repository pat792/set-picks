import React from 'react';

export default function DashboardMobileBrandBar({ user }) {
  return (
    <div className="relative z-20 min-h-16 py-2.5 bg-brand-bg/92 backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 border-b border-border-subtle/35 shadow-[0_8px_24px_-16px_rgba(15,10,46,0.95)] flex items-center justify-between px-4 gap-3">
      
      {/* Structural Container: Stretches across the screen */}
      <h1 className="min-w-0 flex-1 leading-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm">
        
        {/* Color Container: Hugs the text tightly so the gradient completes */}
        <span className="font-bold italic sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 hover:opacity-80 transition-opacity pr-2">
      SETLIST PICK 'EM
      </span>
        
      </h1>

      <div className="w-8 h-8 shrink-0 rounded-full bg-surface-panel-strong border border-border-subtle/35 flex items-center justify-center text-xs">
        {user?.email?.charAt(0).toUpperCase() || '👤'}
      </div>
    </div>
  );
}