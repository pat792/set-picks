import React from 'react';

const baseStyles =
  'inline-flex items-center justify-center rounded-2xl font-black transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles = {
  primary:
    'bg-gradient-to-r from-teal-400 to-teal-500 px-8 py-4 text-slate-900 shadow-[0_0_40px_-10px_rgba(45,212,191,0.5)] hover:shadow-[0_0_60px_-15px_rgba(45,212,191,0.7)] hover:-translate-y-0.5',
  glass:
    'border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45',
  text: 'text-sm font-bold text-slate-300 hover:text-white px-3 py-2',
  link: 'text-sm font-bold text-slate-400 hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-white',
};

const Button = React.forwardRef(function Button(
  { children, variant = 'primary', className = '', type = 'button', ...props },
  ref
) {
  const resolvedVariant = variantStyles[variant] || variantStyles.primary;
  const combinedClassName = [baseStyles, resolvedVariant, className].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={combinedClassName} {...props}>
      {children}
    </button>
  );
});

export default Button;
