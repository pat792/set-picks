import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className = '', ...props }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={[
        'inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
      Back
    </button>
  );
}
