import React from 'react';

const STYLE_MAP = {
  success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-400/40 bg-red-500/10 text-red-300',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  info: 'border-sky-400/40 bg-sky-500/10 text-sky-300',
};

export default function StatusBanner({ type = 'info', message, className = '' }) {
  if (!message) return null;
  const tone = STYLE_MAP[type] || STYLE_MAP.info;
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm font-bold ${tone} ${className}`}>
      {message}
    </div>
  );
}
