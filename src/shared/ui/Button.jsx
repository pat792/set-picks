import React from 'react';

// 1. Removed `rounded-2xl` from here so sizes can control it
const baseStyles =
  'inline-flex items-center justify-center font-black transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed';

// 2. Removed `px-8 py-4` and text sizes from here (variants are now ONLY colors/effects)
const variantStyles = {
  primary:
    'bg-gradient-to-r from-teal-400 to-teal-500 text-slate-900 shadow-[0_0_40px_-10px_rgba(45,212,191,0.5)] hover:shadow-[0_0_60px_-15px_rgba(45,212,191,0.7)] hover:-translate-y-0.5',
  secondary:
    'border-2 border-teal-400/70 bg-transparent text-teal-300 shadow-none hover:bg-teal-400/10 hover:border-teal-300 hover:-translate-y-0.5',
  ghost:
    'border border-indigo-700/70 bg-surface-panel text-slate-300 hover:bg-indigo-900/45 hover:text-teal-300',
  danger:
    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_0_40px_-10px_rgba(239,68,68,0.45)] hover:shadow-[0_0_60px_-15px_rgba(239,68,68,0.6)] hover:-translate-y-0.5',
  glass:
    'border border-border-venue/70 bg-surface-glass backdrop-blur-xl text-white shadow-lg ring-1 ring-border-glass/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-indigo-900/45',
  text: 'text-slate-300 hover:text-white',
  link: 'text-slate-400 hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-white',
};

// 3. NEW: Added a dedicated sizes dictionary for padding, text size, and rounding
const sizeStyles = {
  sm: 'px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl', // For Navbars
  md: 'px-8 py-4 text-base sm:text-lg rounded-2xl', // For Hero CTAs
  none: '', // For pure text buttons without padding
};

const Button = React.forwardRef(function Button(
  // 4. Added `size = 'md'` as a default prop
  { children, variant = 'primary', size = 'md', className = '', type = 'button', ...props },
  ref
) {
  const resolvedVariant = variantStyles[variant] || variantStyles.primary;
  const resolvedSize = sizeStyles[size] || sizeStyles.md; // Resolve the size
  
  // Combine base, variant, size, and custom classes
  const combinedClassName = [baseStyles, resolvedVariant, resolvedSize, className].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={combinedClassName} {...props}>
      {children}
    </button>
  );
});

export default Button;