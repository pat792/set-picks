# Theme Contract (Hybrid Now)

This document defines predictable visual roles for dashboard surfaces and actions.
Use these roles instead of ad hoc screen-level color classes.

## Roles

- `chrome`: navigation bars, utility wrappers, fixed headers.
- `panel`: primary content containers.
- `inset`: nested wells inside a panel (details, sub-sections, score cells).
- `field`: form input surfaces.
- `action-primary`: the highest-priority CTA.
- `action-secondary`: supporting actions.
- `status-success`: positive/result emphasis.
- `status-warning` / `status-danger`: warning/destructive states.

## Component Mapping

- `Card` (`src/shared/ui/Card.jsx`)
  - `chrome` -> top/bottom bars and utility containers.
  - `panel`/`default` -> base container.
  - `solid` -> emphasized container.
  - `inset`/`nested` -> subordinate grouped content.
  - `alert`, `danger` -> semantic states.
- `Button` (`src/shared/ui/Button.jsx`)
  - `primary`, `secondary`, `ghost`, `danger`, `text`, `link`.
- `Input` (`src/shared/ui/Input.jsx`)
  - all text-like controls use `surface.field`.
- `GhostPill` (`src/shared/ui/GhostPill.jsx`)
  - low-emphasis controls/chips tied to `panel` + accent hover.

## Accent Semantics

- Teal (`brand.primary`) = interactive emphasis (buttons, focus, selected nav/action affordances).
- Emerald = score/success emphasis (leader names, points, success status).
- Avoid mixing cyan/fuchsia accents in default dashboard/scoring containers.

## Do / Don't

- Do use semantic tokens from `tailwind.config.js`:
  - `bg-surface-*`, `border-border-*`, `text-brand-*`.
- Do route new container styles through shared `Card` variants when possible.
- Do keep visual changes composable via variant props.
- Don't use direct `bg-slate-*` or `border-slate-*` for dashboard/scoring shell surfaces.
- Don't add one-off border/ring colors to page components when a shared role already exists.

## Verification

- Run `npm run verify:theme-contract` to catch forbidden shell surface regressions.
- Run `npm run verify:dashboard-meta` after dashboard route meta updates.
