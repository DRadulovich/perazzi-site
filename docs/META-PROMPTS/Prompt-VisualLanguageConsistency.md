# Task: Audit UI “visual language” consistency (audit-only; no code changes)

You’re working in a Next.js + React repo where the **site UI visual language** drifted over time (multiple styling approaches, multiple headless UI libs, multiple icon sets, etc.). I want an **audit report only**. **Do not implement or change any code**.

## Primary scope (site UI)
- Focus analysis on:
  - `src/app`
  - `src/components`
- You may read supporting config files that affect site UI (Tailwind config, global CSS, Next layouts/providers), but **do not edit anything**.

## Out of scope
- Sanity Studio visual language is not important. Don’t propose migrations inside Studio-only code unless required to avoid breaking builds. The goal is consistency for the **site UI**.

---

## Precedence / entry-point check (do this first; still no code changes)
Before auditing individual components, identify the repo’s “global visual language entry points” and anything that can override styling so we don’t chase changes that get superseded.

Inspect and summarize (with file paths):
- `src/app/**/layout.tsx` (and `src/app/layout.tsx` first): global wrappers, `<html>/<body>` classes, font setup, dark mode class, etc.
- Provider files such as `src/app/providers.tsx`, `src/app/**/providers.tsx`, and any `*Provider*` components used by layouts (theme, motion, modal/toast, intl).
- Global CSS and style import order: `src/app/**/globals.css`, any `src/styles/**`, and where they’re imported.
- Tailwind wiring: `tailwind.config.*`, `postcss.config.*`, and any CSS `@layer` usage that could change precedence.
- Any CSS-in-JS setup that affects injection order (e.g., styled-components registry/SSR setup), if present.

In the audit report, include an **Override map** section that explains what has highest precedence (layout/body classes, global CSS, Tailwind layers, styled-components injection order, etc.) and call out any places where these globals would override per-component styles.

---

## What to audit (visual language drift)
- Styling systems: Tailwind vs `styled-components` vs CSS modules/plain CSS
- Headless/primitives: Radix (`@radix-ui/*`) vs Headless UI (`@headlessui/react`)
- Tokens/theme: colors, typography, spacing, radii, shadows, motion (CSS vars, theme objects, global styles)
- Icons: `lucide-react` vs `react-icons` (ignore `@sanity/icons` unless it appears in `src/app`/`src/components`)
- Reusable UI primitives patterns: Button/Input/Modal/Dialog/Tooltip/etc

---

## Deliverable: Folder-first audit report (no code changes)
Produce the report in this order, with file paths throughout.

### 1) `src/app` (by route/segment if possible)
For each segment/route group you find, list:
- UI systems used there (Tailwind, styled-components, Radix, Headless UI, icon set, motion)
- Key files/components involved (paths)
- Drift/conflicts inside that area (e.g., “uses Tailwind + styled-components together”, “Dialog is Headless UI here but Radix elsewhere”)

### 2) `src/components` (by component area)
Group components by subfolder and list:
- Which styling + primitive + icon patterns each subfolder uses
- Any duplicate primitives (multiple Buttons, multiple Modals, multiple Tooltip wrappers), with paths
- Any token/theme inconsistencies (font classes, spacing conventions, radii/shadows patterns)

### 3) Cross-cutting findings (still folder-referenced)
- “Conflict clusters” that span both folders, with the involved paths
- Rough counts of imports/usages for:
  - `styled-components`
  - `@radix-ui/*`
  - `@headlessui/react`
  - `lucide-react`
  - `react-icons`

### 4) Canonical baseline guess (site UI)
- Based on recency + prevalence in `src/app` + `src/components`, state what looks like the current intended baseline and what looks legacy.

### 5) Recommendations (audit-only; do not implement)
Recommend Tailwind-first standardization choices, justified by the audit:
- Radix-only vs HeadlessUI-only for site UI (pick one and explain using the audit)
- Icon standard (prefer `lucide-react` unless audit indicates otherwise)
- `styled-components`: remove vs isolate (and why)

Also list the top 5 migration steps you would do *later*, but **do not perform them**.

---

## Stop condition (strict)
Stop after producing the audit report and asking me to confirm:
1) Radix-only vs HeadlessUI-only
2) Remove vs isolate `styled-components`

Do not make any repo changes until I confirm those choices.