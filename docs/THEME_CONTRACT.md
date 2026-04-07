# Theme contract (shared UI)

Canonical visual roles for dashboard/scoring shells. **Authoritative palette, typography, and do/don’t rules:** [`design.md`](./design.md).

## Layer ownership (FSD)

| Layer | Owns |
|--------|------|
| `src/shared/ui` | Reusable primitives and variant APIs (buttons, pills, cards, inputs). |
| `src/features/*/ui` | Composition and feature-specific layout; consumes shared primitives instead of one-off class bundles where a primitive exists. |
| `src/pages` | Route wiring and composing feature UI only. |

## Primitives ↔ roles

| Role | Component | Notes |
|------|-----------|--------|
| Compare / filter toggles | `FilterPill` | Pill shape; **active** = `surface-panel-strong` + `border-subtle` (not brand teal). |
| Dashboard row nav / overflow | `DashboardRowPill` | Polymorphic (`as={Link}`, `as="summary"`). Tones: `muted`, `accent`. |
| Icon + label ghost actions | `GhostPill` | Same glass/surface language as row pills; picks + standings secondary actions. |
| Primary / secondary CTAs | `Button` | Rounded-xl family; brand gradient primary (see `Button.jsx`). |
| Panel containers | `Card` | `surface-panel` / `surface-panel-strong` variants. |

## Tailwind tokens

Semantic colors live in `tailwind.config.js` under `brand`, `surface`, and `border`. Prefer these over raw `slate-*` / `emerald-*` for new dashboard work so theming stays centralized.

## Migration

When touching a file with ad hoc pill or filter classes, prefer the table above. If no primitive fits, add a small variant to an existing shared component (or propose a new primitive) rather than copying class strings across features.
