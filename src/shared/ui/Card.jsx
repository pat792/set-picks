import React from 'react';

const variantStyles = {
  panel:
    'bg-surface-panel border border-border-muted/45 rounded-3xl shadow-lg ring-1 ring-border-glass/25',
  default:
    'bg-surface-panel border border-border-muted/45 rounded-3xl shadow-lg ring-1 ring-border-glass/25',
  chrome:
    'bg-surface-chrome border border-border-muted/45 rounded-2xl shadow-lg ring-1 ring-border-glass/25',
  solid:
    'bg-surface-panel-strong border border-border-muted/50 rounded-2xl shadow-lg ring-1 ring-border-glass/30',
  inset: 'rounded-xl border border-border-muted/45 bg-surface-inset ring-1 ring-border-glass/20',
  glass:
    'border border-border-muted/50 bg-surface-glass backdrop-blur-xl ring-1 ring-border-glass/25 shadow-inset-glass shadow-lg',
  alert: 'bg-amber-500/10 border border-amber-500/30 rounded-xl',
  danger: 'bg-red-500/10 border border-red-500/50 rounded-2xl',
  nested: 'rounded-xl border border-border-muted/45 bg-surface-inset ring-1 ring-border-glass/20',
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
