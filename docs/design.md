# Design System Guidelines: Setlist Pick'em

## 1. Visual Theme & Atmosphere

Setlist Pick'em features a deep, high-contrast "dark mode" interface that captures the midnight excitement of live music. The design uses a neon teal (`#2dd4bf`) as the primary brand accent against deep slate backgrounds (`#0f172a`, `#020617`). The aesthetic relies heavily on "glassmorphism"—using translucent surface panels (`rgb(30 41 59 / 0.5)`) and subtle border glows rather than flat, opaque cards. 

The typography utilizes a two-font system: **Space Grotesk** for high-impact, stylized headings and branding, and **Inter** for highly legible, dense data (like leaderboards and settings). 

**Key Characteristics:**
- **Neon Teal** (`#2dd4bf`) as the primary interactive accent, often paired with a custom neon drop-shadow glow (`shadow-glow-brand`).
- **Two-font system**: `Space Grotesk` (Display) and `Inter` (Sans/Body).
- **Glass Surfaces**: Cards and inputs use translucent backgrounds (`bg-surface-panel`) with subtle inset borders.
- **Differentiated Buttons**: Primary action buttons use rounded rectangles, while secondary filters use full pill shapes.
- **Gradients**: The main brand wordmark utilizes a red-to-blue gradient (`#ef4444` to `#3b82f6`).

## 2. Color Palette & Roles (Tailwind Tokens)

### Brand & Interactive
- **Brand Primary (`brand-primary`)**: `#2dd4bf` — Primary CTAs, active states, user scores.
- **Brand Strong (`brand-primary-strong`)**: `#14b8a6` — Button hover states, high-emphasis icons.
- **Brand Kicker (`brand-kicker`)**: `#2dd4bf` — Secondary accents.
- **Accent Red (`brand-accent-red`)**: `#ef4444` — Incorrect picks, destructive actions, logo gradient start.
- **Accent Blue (`brand-accent-blue`)**: `#3b82f6` — Logo gradient end.

### Backgrounds (Deep Slate)
- **Base Bg (`brand-bg`)**: `#0f172a` — Standard application background.
- **Deep Bg (`brand-bg-deep`)**: `#020617` — Maximum contrast areas, lowest elevation.

### Surfaces (Glassmorphism)
- **Glass (`surface-glass`)**: `rgb(2 6 23 / 0.3)` — Extremely subtle translucent overlays.
- **Panel (`surface-panel`)**: `rgb(30 41 59 / 0.5)` — Standard card and container backgrounds.
- **Panel Strong (`surface-panel-strong`)**: `rgb(30 41 59 / 0.8)` — Elevated modals, dropdowns.
- **Field (`surface-field`)**: `#0f172a` — Form input backgrounds (like song selection slots).

### Borders
- **Glass Border (`border-glass`)**: `rgba(255, 255, 255, 0.25)` — Highlights on elevated cards.
- **Subtle Border (`border-subtle`)**: `rgb(51 65 85 / 0.5)` — Standard card and input outlines.
- **Muted Border (`border-muted`)**: `rgb(71 85 105 / 0.6)` — Dividers.

### Semantic & Gamification
- **Rank 1 Gold**: `#d97706` (or standard `text-amber-500`/`bg-amber-500`) — Used exclusively for 1st place leaderboard indicators.
- **Success/Score Teal**: `text-brand-primary` — Used to highlight user scores (e.g., "45 PTS").

## 3. Typography Rules

### Font Families
- **Display (`font-display`)**: `Space Grotesk` — Used for all page titles, hero text, and the brand wordmark.
- **Sans/Body (`font-sans`)**: `Inter` — Used for all buttons, UI elements, song names, and leaderboards.

### Hierarchy (Tailwind Classes)

| Role | Class | Font | Size / Line Height | Tracking |
|------|-------|------|--------------------|----------|
| Splash Hero | `text-display-hero-splash` | Space Grotesk | 3.75rem / 1.04 | -0.028em |
| Page Title | `text-display-page` | Space Grotesk | 2rem / 1.2 | -0.02em |
| Brand Wordmark | `text-display-brand-bar` | Space Grotesk | 1.5625rem / 1.08 | -0.02em |
| Section Header | `text-display-sm` | Space Grotesk | 1.3125rem / 1.28 | -0.015em |
| General Title | `text-title` | Inter | 1.5rem / 1.2 (Bold) | Normal |
| Standard Body | `text-body` | Inter | 0.875rem / 1.5 | Normal |

## 4. Component Stylings & Shapes (CRITICAL)

### Primary Action Buttons (CTAs)
- **Role:** Submitting forms, updating data, major state changes (e.g., "UPDATE PICKS", "JOIN POOL").
- **Shape:** Rounded Rectangle (`rounded-xl` or `rounded-2xl`). Do NOT use `rounded-full`.
- **Style:** Solid `bg-brand-primary` with dark text (`text-brand-bg-deep`).
- **Hover:** `bg-brand-primary-strong` with `shadow-glow-brand`.

### Filters & Chips
- **Role:** Toggling data, switching views (e.g., the "Compare" pool filters like "Everyone").
- **Shape:** Full Pill (`rounded-full`).
- **Style (Inactive):** `bg-surface-panel` with no border or a transparent border.
- **Style (Active):** Slightly lighter indigo fill (`bg-surface-panel-strong`) with a visible indigo/slate border (`border-border-subtle`). Do not use teal here to avoid competing with CTAs.

### Navigation Tabs (Segmented Controls)
- **Role:** Switching major container views (e.g., "Join Pool" vs "Create Pool").
- **Style (Active):** Dark background with a bottom border/glow using `brand-primary` (`border-b-2 border-brand-primary`).

### Form Inputs & Pick Slots
- **Shape:** `rounded-lg` or `rounded-xl`.
- **Inactive:** `bg-surface-field` with `border border-border-subtle` (keep it dark and muted).
- **Focus/Active:** Change border or ring to `brand-primary` (`ring-brand` or `border-brand-primary`) to guide the user's eye. Do not use random blue/indigo borders.

### Cards (Leaderboard & Pools)
- **Background:** `bg-surface-panel`
- **Border:** `border border-border-subtle`
- **Radius:** `rounded-xl` or `rounded-2xl`
- **Focus/Active State:** Add `shadow-inset-glass`.

## 5. Depth & Elevation (Glows over Shadows)

Because the app uses a dark theme, traditional black drop-shadows do not work. Depth is achieved through inset borders and neon glows.
- **Brand Glow (`shadow-glow-brand`)**: Use on primary interactive elements to make them pop off the dark background.
- **Inset Glass (`shadow-inset-glass`)**: Use inside panels to create a subtle 3D / beveled edge effect.

## 6. Do's and Don'ts

### Do
- Use `font-display` exclusively for large headings, keeping `font-sans` for dense UI to ensure readability.
- Rely on `surface-panel` with opacity for cards so the underlying `brand-bg` bleeds through slightly.
- Use `brand-primary` for scores and ranks to draw the user's eye immediately to the gamification elements.
- Strictly adhere to the shape rules: `rounded-xl` for CTAs and inputs, `rounded-full` for chips and filters.

### Don't
- Don't use opaque, solid gray backgrounds for cards; always use the translucent `surface-` variables.
- Don't mix border radii randomly (e.g., don't put a `rounded-full` CTA inside a perfectly square card).
- Don't use traditional drop shadows (`shadow-md`, `shadow-xl`); use the custom `glow` shadows.

## 7. Agent Prompt Guide

### Quick Tailwind Class Reference
- **Background:** `bg-brand-bg`
- **Standard Card:** `bg-surface-panel border border-border-subtle rounded-xl`
- **Primary Text:** `text-white font-sans`
- **Page Heading:** `text-display-page font-display font-bold text-white`
- **Primary Button (CTA):** `bg-brand-primary text-brand-bg-deep rounded-xl font-bold px-6 py-3 hover:bg-brand-primary-strong shadow-glow-brand`
- **Filter Pill (Active):** `bg-surface-panel-strong border border-border-muted rounded-full px-4 py-1 text-sm`

### Example Component Prompts
- *"Create a leaderboard row: Use `bg-surface-panel` with a `border-border-subtle` and `rounded-xl`. The user's rank should be in a small box. If the rank is 1, use the gold badge styling. The score text should be `text-brand-primary font-bold`."*
- *"Build a show card: `bg-brand-bg` container. Title should be `font-display text-display-md text-white`. Add a primary CTA rounded-rectangle button using `bg-brand-primary`."*