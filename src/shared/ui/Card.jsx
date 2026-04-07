import React from 'react';

const variantStyles = {
  default:
    'bg-surface-panel border border-border-venue rounded-3xl shadow-lg ring-1 ring-fuchsia-500/15',
  solid:
    'bg-surface-panel-strong border border-border-venue rounded-2xl shadow-lg ring-1 ring-fuchsia-500/20',
  glass:
    'border border-border-venue/80 bg-surface-glass backdrop-blur-xl ring-1 ring-fuchsia-500/10 shadow-inset-glass shadow-lg',
  alert: 'bg-amber-500/10 border border-amber-500/30 rounded-xl',
  danger: 'bg-red-500/10 border border-red-500/50 rounded-2xl',
  nested: 'rounded-xl border border-cyan-500/20 bg-surface-inset ring-1 ring-fuchsia-500/10',
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
