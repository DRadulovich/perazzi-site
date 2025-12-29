# Site Style System Map (Tailwind + Tokens)

This document maps how styling is actually produced across the site today (tokens → Tailwind theme → primitives → feature components), and calls out the highest-impact configuration clashes that currently prevent the system from behaving holistically.

Scope: site UI only (`src/app/(site)`, `src/components`). Admin/Studio are intentionally separate.

## 1) The styling pipeline (source → output)

### 1.1 Tokens (CSS custom properties)
- Primary source: `src/styles/site-theme.css`
  - `:root` defines light tokens.
  - `[data-theme="dark"]` overrides tokens for dark mode (applies to any subtree with `data-theme="dark"`).

### 1.2 Tailwind v4 theme bindings
- Source: `src/styles/site-theme.css` `@theme inline { ... }`
- Effect: Tailwind utilities like `bg-card`, `text-ink`, `border-border` resolve to `--color-*` variables defined here.
- Current bindings you rely on heavily:
  - `--color-canvas` → `bg-canvas`, `text-canvas`, etc.
  - `--color-card` → `bg-card`, `text-card`, etc.
  - `--color-ink` → `text-ink`, `bg-ink`, etc.
  - `--color-ink-muted` → `text-ink-muted`, etc.
  - `--color-border` → `border-border`, `ring-border`, etc.
  - `--color-perazzi-red|black|white` → `bg-perazzi-red`, etc.

### 1.3 Global semantic helpers + custom utilities
- Source: `src/styles/site-theme.css`
- These are **not** Tailwind-generated; they are bespoke classes that happen to resemble Tailwind names:
  - Focus ring: `.focus-ring` + `.focus-ring:focus-visible`
  - Radius scale overrides: `.rounded-xl`, `.rounded-2xl`, `.rounded-3xl` (with `!important`)
  - Shadow scale: `.shadow-soft`, `.shadow-medium`, `.shadow-elevated`
  - Semantic helpers: `.bg-canvas`, `.bg-card`, `.bg-elevated`, `.text-ink`, `.text-ink-muted`, `.border-subtle`, `.border-border`
  - Legacy helpers still present: `.bg-brand`, `.bg-brand-hover`, `.button-primary`, `.button-secondary`, `.btn--primary`

### 1.4 Theme switching (light/dark)
- Initial server-side theme:
  - `src/app/layout.tsx` sets `data-theme` on `<html>` using `resolveInitialTheme(...)`.
  - `src/lib/initial-theme.ts` reads cookie + `Sec-CH-Prefers-Color-Scheme`.
- Client-side theme updates:
  - `src/components/theme/ThemeProvider.tsx` updates `document.documentElement.dataset.theme`.
- Per-section overrides:
  - `src/components/ui/section.tsx` can set `data-theme="light|dark"` on the section subtree.

## 2) Core primitives (the “design system surface area”)

These are the files that determine the default look/feel of repeated UI patterns:

- Typography primitives:
  - `src/components/ui/heading.tsx` (size scale + default fonts)
  - `src/components/ui/text.tsx` (body scale + leading + muted tone)
  - `src/components/page-heading.tsx` (composition)
- Controls:
  - `src/components/ui/button.tsx` (variants, size scale, uppercase/tracking, focus-ring)
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`
- Layout:
  - `src/components/ui/container.tsx` (width + horizontal padding)
  - `src/components/ui/section.tsx` (surface + border + backdrop + per-section theme)
- Overlays:
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/tooltip.tsx`

## 3) Feature components (where bespoke styling lives)

Most feature components are bespoke, but they generally fall into a few patterns:

- “Glass card” pattern: `rounded-* + border-border/70 + bg-card/60..95 + shadow-* + backdrop-blur-*`
  - Common across: Experience, Shotguns, Heritage, Bespoke, Journal lightboxes.
- “Full-bleed cinematic section”: `w-screen` with `marginLeft/marginRight: calc(50% - 50vw)` + image + scrim overlay + inner `Section`.
- Dark-on-image sections frequently use literal neutrals (`text-white`, `text-neutral-*`, `bg-black/*`) instead of token-based `text-ink`/`bg-card` so they’re less theme-sensitive.

## 4) High-impact clashes (things currently fighting each other)

### 4.1 Two “brand reds” (and mixed naming)
- `src/styles/site-theme.css` defines both:
  - `--brand` / `--brand-hover` (legacy)
  - `--perazzi-red` (new system token)
- Concierge components use `.bg-brand` / `.bg-brand-hover` while most of the site uses `bg-perazzi-red`.
  - Result: red hues differ between Concierge and the rest of the site, and hover behaviors diverge.

### 4.2 Missing Tailwind color tokens that components assume exist
- Multiple components use Tailwind classes like:
  - `bg-subtle`, `divide-subtle`, `disabled:bg-subtle`, `hover:bg-subtle`
  - `ring-brand`, `focus-visible:ring-brand`, `hover:border-l-subtle`
- But `src/styles/site-theme.css` `@theme inline` does **not** define `--color-subtle` or `--color-brand`.
  - Result: those utilities either don’t exist in the generated CSS (e.g., `bg-subtle`) or resolve to undefined CSS variables (e.g., `ring-brand`), so intended styling silently fails.

### 4.3 A scrim token is referenced but not defined
- `src/components/heritage/SerialLookup.tsx` uses `bg-(--scrim-hard)` but `src/styles/site-theme.css` only defines `--scrim-soft` and `--scrim-strong`.
  - Result: the Serial Lookup overlay scrim may be missing/incorrect.

### 4.4 “Radius scale” overrides prevent legitimate local overrides
- `src/styles/site-theme.css` overrides `.rounded-xl|2xl|3xl` using `!important`.
- `src/components/ui/button.tsx` hardcodes `rounded-xl` in all sizes.
- Many feature components pass `className="rounded-full ..."` to `Button` expecting a pill.
  - Result: those `rounded-full` attempts likely lose to the hardcoded `rounded-xl` (and the `!important` override), creating inconsistent “pill” CTA styling across the site.

### 4.5 `cn()` does not merge conflicting Tailwind classes
- `src/lib/utils.ts` is `clsx` only, not `tailwind-merge`.
- Several primitives/components rely on “override the base class by passing another Tailwind class” (e.g. `Input` base border/background, then callers pass `border-0 bg-transparent shadow-none`).
  - Result: overrides work only if Tailwind’s generated CSS order happens to favor the caller’s class; it’s fragile and hard to reason about system-wide.

### 4.6 Focus styling is inconsistent across the app
- Some components rely on `.focus-ring` (custom box-shadow system).
- Others use Tailwind `ring-*`, `outline-*`, or `focus-visible:ring-*` directly (often with different colors/weights).
  - Result: keyboard focus affordances vary by page/component, even for similar interactive elements.

### 4.7 Multiple overlay/dialog implementations
- You have a Radix-based primitive (`src/components/ui/dialog.tsx`) but some features implement their own overlay/dialog UI (e.g., `motion.dialog` in Home hero).
  - Result: overlay density, borders, blur, and close controls vary across experiences.

## 5) Recommended “holistic system” decisions (before refactors)

If the goal is a coherent, leverageable system:
- Decide which set of tokens is canonical (`--perazzi-*` + `--surface-*` + `--ink-*` vs the legacy `--brand/--card/--ink/--subtle` set).
- Ensure Tailwind’s theme includes every semantic color name you rely on (`brand`, `subtle`, etc.) **or** remove those utilities from components.
- Decide whether “pill CTAs” are a supported primitive shape; if yes, `Button` must allow it (and radius overrides must not block it).
- Choose one focus system (`.focus-ring` vs Tailwind `ring-*`) and standardize.

