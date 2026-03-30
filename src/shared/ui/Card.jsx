import React from 'react';

const variantStyles = {
  default:
    'bg-surface-panel border border-slate-700/50 rounded-3xl shadow-lg',
  solid: 'bg-surface-panel-strong border border-slate-700 rounded-2xl shadow-lg',
  glass:
    'border border-white/10 bg-surface-glass backdrop-blur-xl ring-1 ring-white/10 shadow-inset-glass shadow-lg',
  alert: 'bg-amber-500/10 border border-amber-500/30 rounded-xl',
  danger: 'bg-red-500/10 border border-red-500/50 rounded-2xl',
  nested: 'rounded-xl border border-slate-600/60 bg-surface-inset',
  plain: '',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Modular surface container — glass/panel patterns from dashboard + splash.
 */
const Card = React.forwardRef(function Card(
  { as: Component = 'div', variant = 'default', padding = 'md', className = '', children, ...props },
  ref
) {
  const v = variantStyles[variant] ?? variantStyles.default;
  const p = paddingStyles[padding] ?? paddingStyles.md;
  const combined = [v, p, className].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={combined} {...props}>
      {children}
    </Component>
  );
});

export default Card;
