# First Audit Report: Site Aesthetic Sources of Truth

## Scope
- App router pages under `src/app/(site)` are treated as front-facing.
- Admin and studio surfaces (`src/app/admin`, `src/app/next-studio`, `src/app/debug-studio`, `src/sanity`) are excluded except where they overlap tokens.

## Front-Facing Pages (App Router)
- `/` -> `src/app/(site)/page.tsx`
- `/bespoke` -> `src/app/(site)/bespoke/page.tsx`
- `/bespoke-build` -> `src/app/(site)/bespoke-build/page.tsx`
- `/bespoke-build/[stage]` -> `src/app/(site)/bespoke-build/[stage]/page.tsx`
- `/concierge` -> `src/app/(site)/concierge/page.tsx`
- `/engravings` -> `src/app/(site)/engravings/page.tsx`
- `/experience` -> `src/app/(site)/experience/page.tsx`
- `/fschat` -> `src/app/(site)/fschat/page.tsx`
- `/heritage` -> `src/app/(site)/heritage/page.tsx`
- `/heritage/[section]` -> `src/app/(site)/heritage/[section]/page.tsx`
- `/journal` -> `src/app/(site)/journal/page.tsx`
- `/journal/[slug]` -> `src/app/(site)/journal/[slug]/page.tsx`
- `/journal/champion-interviews` -> `src/app/(site)/journal/champion-interviews/page.tsx`
- `/journal/news` -> `src/app/(site)/journal/news/page.tsx`
- `/journal/stories-of-craft` -> `src/app/(site)/journal/stories-of-craft/page.tsx`
- `/service` -> `src/app/(site)/service/page.tsx`
- `/shotguns` -> `src/app/(site)/shotguns/page.tsx`
- `/shotguns/all` -> `src/app/(site)/shotguns/all/page.tsx`
- `/shotguns/dc` -> `src/app/(site)/shotguns/dc/page.tsx`
- `/shotguns/disciplines/[slug]` -> `src/app/(site)/shotguns/disciplines/[slug]/page.tsx`
- `/shotguns/gauges` -> `src/app/(site)/shotguns/gauges/page.tsx`
- `/shotguns/grades` -> `src/app/(site)/shotguns/grades/page.tsx`
- `/shotguns/ht` -> `src/app/(site)/shotguns/ht/page.tsx`
- `/shotguns/mx` -> `src/app/(site)/shotguns/mx/page.tsx`
- `/shotguns/sho` -> `src/app/(site)/shotguns/sho/page.tsx`
- `/shotguns/tm` -> `src/app/(site)/shotguns/tm/page.tsx`
- `/the-build/why-a-perazzi-has-a-soul` -> `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx`

## Global Visual Language Entry Points
- Root layout and fonts: `src/app/layout.tsx` (Next font setup, body classes).
- Global styles + tokens: `src/styles/site-theme.css` (CSS variables, `@theme inline`, utility layers, base styles, keyframes) imported by `src/app/globals.css`.
- Theme bootstrapping: `src/app/head.tsx` (inline theme init script), `src/components/theme/ThemeProvider.tsx` (sets `data-theme`).
- Site layout wrapper: `src/components/site-shell.tsx` (nav, footer, shared chrome).
- Site-only providers: `src/app/(site)/layout.tsx` and `src/app/providers.tsx`.
- UI primitives: `src/components/ui/*` (Button, Text, Heading, Section, Container, etc.).

## Current Sources of Truth (Aesthetics)

### Tokens, Colors, Surfaces
- **Primary token file**: `src/styles/site-theme.css` defines `:root` and `[data-theme="dark"]` CSS variables, plus Tailwind token bindings in `@theme inline`.
- **Token duplication**:
  - `--brand` / `--brand-hover` (used by `bg-brand` and chat styles) differ from `--perazzi-red` and other Perazzi tokens.
  - `--card`, `--ink`, `--canvas` coexist with `--surface-*` and `--ink-*` tokens.
- **Radii and shadows** live in `src/styles/site-theme.css` (`rounded-*`, `shadow-*`), plus component-local Tailwind classes.

### Typography
- `src/app/layout.tsx` sets Next fonts with CSS variables (`--font-geist-sans`, `--font-geist-mono`, `--font-artisan`).
- `src/styles/site-theme.css` defines `--font-sans`, `--font-serif`, `--font-artisan`, `--font-mono` in `@theme inline` and sets `body` to `var(--font-sans)`.
- `src/components/ui/heading.tsx` and `src/components/ui/text.tsx` define a typography scale, but many components still hardcode sizes/weights/tracking (e.g. `text-[11px]`, `tracking-[0.35em]`, `font-black`), creating a parallel source of typographic truth.
- Rich text relies on `.prose` styles in `src/styles/site-theme.css` via `@tailwindcss/typography`.
- Documentation sources: `docs/ui-style-contract.md`, `docs/GUIDES/General-Templates/Guide-VisualLanguage.md`, `docs/GUIDES/General-Templates/Guide-GlassComponentStyling.md`.

### Motion
- `framer-motion` is used across hero and scroller components with per-component motion values.
- `src/lib/motionConfig.ts` defines a small motion token set used in `HeritageEventRail` only.
- CSS motion tokens live in `src/styles/site-theme.css` (`@keyframes accordion-*`, `transition` usage in classnames).
- Guidelines live in `docs/ui-style-contract.md` and `docs/GUIDES/General-Templates/Guide-MobileDesign.md`.

### Visual Language Patterns
- Glass/scrim overlays and cinematic gradients are centralized in `src/styles/site-theme.css` utilities (e.g. `overlay-gradient-*`) instead of repeated inline `style` blocks.
- `docs/GUIDES/General-Templates/Guide-GlassComponentStyling.md` documents this pattern but does not centralize it in code.

### Chat Styling (Site UI)
- `src/components/chat/chat.module.css` is a standalone style system using `--brand`, `--card`, `--ink` variables.

### Non-Site Styling (Out of Scope but Related)
- `src/sanity/studioTheme.ts` defines a separate token palette for Sanity Studio.
- `src/app/admin/*` uses its own styling conventions and color constants.

## Drift / Conflicts Observed
- Multiple brand reds in use (`--brand` vs `--perazzi-red`), leading to inconsistent accents and CTA coloring.
- Dual surface/ink token systems (`--card`/`--ink`/`--canvas` vs `--surface-*`/`--ink-*`).
- Typography is split between `Heading`/`Text` primitives and numerous bespoke Tailwind class patterns.
- Motion values are mostly inline; `src/lib/motionConfig.ts` is not a central system.
- Repeated glass/scrim gradient strings are duplicated across components.
- Unused/legacy classes exist in `src/styles/site-theme.css` (`.btn--primary`, `.button-primary`, `.button-secondary`).

## Consolidation Proposal (Single File Source of Truth)
**Recommendation:** Use `src/styles/site-theme.css` as the single canonical aesthetics file and treat it as the only source of truth for tokens, typography scale, motion constants, radius, shadows, and surface patterns.

Suggested consolidation path:
1. **Token unification in `src/styles/site-theme.css`**
   - Pick one brand token set (e.g. keep `--perazzi-*` and alias `--brand` to `--perazzi-red` if needed).
   - Collapse `--card`/`--ink`/`--canvas` into `--surface-*` and `--ink-*` equivalents (or vice-versa) and remove duplicates.
2. **Typography scale in `src/styles/site-theme.css`**
   - Encode heading/body/microcopy scales as CSS variables or Tailwind theme tokens in `@theme inline`.
   - Ensure `Heading` and `Text` consume those variables so the scale lives in one place.
3. **Motion tokens in `src/styles/site-theme.css`**
   - Define CSS variables for standard durations/easings; reference them in Tailwind classes and, where feasible, in motion components.
   - Deprecate `src/lib/motionConfig.ts` or derive it from the CSS variables if JS access is still needed.
4. **Pattern extraction**
   - Convert repeated scrim/gradient patterns into reusable CSS classes or `@layer utilities` in `src/styles/site-theme.css`.
5. **Remove or rewire duplicates**
   - Remove unused `.btn--primary`/`.button-*` if not referenced.
6. **Documentation alignment**
   - Update docs to explicitly declare `src/styles/site-theme.css` as the single source of truth and describe how to add/modify tokens there.

This approach keeps all aesthetics centralized in one file while allowing components to reference shared tokens via Tailwind utilities and CSS variables.
