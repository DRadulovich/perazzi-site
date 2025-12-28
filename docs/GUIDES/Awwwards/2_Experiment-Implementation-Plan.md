# Implementation Plan: `/experiments` Direction Demo (Parent + 3 Subpages)

## Goal
Create an **experiential sandbox** at `/experiments` with three subpages that are **identical in content** (same copy + same images + same module structure) but **filtered** through three different systems:
1) Quiet Monument Editorial  
2) Atelier Ledger (your “Atelier Lodge” typo can be used as label if you prefer)  
3) Rite of Passage

**Hard constraints**
- No new dependencies.
- Keep scope isolated to the experiments route (avoid touching global primitives unless absolutely necessary).
- Performance discipline: avoid heavy always-on scroll work; any parallax/pinning must be optional and direction-gated.
- Accessibility: every direction must have a clear `prefers-reduced-motion` path (disable parallax, disable sticky/pin, disable long entrance sequences).

---

## Proposed Route Map
- `/experiments` → index page with 3 links
- `/experiments/quiet-monument`
- `/experiments/atelier-ledger`
- `/experiments/rite-of-passage`

Implementation detail: use a **single dynamic route** so the content stays truly identical:
- `src/app/(site)/experiments/[direction]/page.tsx`

---

## Files to Add (target structure)
### Routes
- `src/app/(site)/experiments/layout.tsx`
- `src/app/(site)/experiments/experiments.css`
- `src/app/(site)/experiments/page.tsx`
- `src/app/(site)/experiments/[direction]/page.tsx`

### Experiment components + config
- `src/components/experiments/directions.ts`
- `src/components/experiments/DirectionSwitcher.tsx`
- `src/components/experiments/DirectionDemoClient.tsx`
- (optional, if you want a direction-tunable overlay that’s consistent) `src/components/experiments/ExperimentDialog.tsx`

---

# Task Cards (sequenced, Codex-implementable)

## TC-EXP-01 — Scaffold `/experiments` with isolated layout + noindex
**Objective**
Create the route segment and ensure it’s visually consistent with the site but isolated and not indexed.

**Files**
- Add: `src/app/(site)/experiments/layout.tsx`
- Add: `src/app/(site)/experiments/experiments.css`

**Steps**
- In `src/app/(site)/experiments/layout.tsx`:
  - Wrap children in `src/components/site-shell.tsx` with `showChatWidget={false}` (experiments should feel quiet and undistracted).
  - Add metadata to discourage indexing (e.g., robots noindex/nofollow) at the layout level so it applies to all `/experiments/*`.
  - Import `src/app/(site)/experiments/experiments.css`.
  - (Optional but recommended) load an **experiment-only serif font** using `next/font/google` inside this layout so Quiet Monument + Rite can actually use serif without changing the rest of the site. Keep it to one font family and expose it via a CSS variable like `--exp-font-serif`.

**Acceptance criteria**
- Visiting `/experiments` uses the normal site shell (nav/footer) but does **not** show the chat rail/widget.
- `/experiments/*` is `noindex` (metadata present).
- `src/app/(site)/experiments/experiments.css` is loaded only for this route subtree.

---

## TC-EXP-02 — Build `/experiments` index page (3 links)
**Objective**
Add the parent page that introduces the experiment and links to the 3 directions.

**Files**
- Add: `src/app/(site)/experiments/page.tsx`
- Use config from: `src/components/experiments/directions.ts` (created in TC-EXP-03)

**Steps**
- Create a simple page with:
  - Title + one-paragraph “what this is”
  - 3 cards/links (Quiet Monument / Atelier Ledger / Rite of Passage)
  - Small notes: “Desktop recommended” and “Respects reduced motion”
- Do not add this to global nav (leave it discoverable only by direct URL).

**Acceptance criteria**
- `/experiments` renders cleanly and links to the 3 subpages.
- Uses consistent spacing and surfaces (tokens from `src/app/globals.css:1`), but typography can be experiment-specific via `.exp-*` classes.

---

## TC-EXP-03 — Create direction config + helpers (single source of truth)
**Objective**
Define the three directions once (labels, slugs, and system tokens).

**Files**
- Add: `src/components/experiments/directions.ts`

**Steps**
- Export:
  - `type ExperimentDirectionKey = "quiet-monument" | "atelier-ledger" | "rite-of-passage"`
  - `EXPERIMENT_DIRECTIONS`: array with `{ key, label, href, description }`
  - A `getDirection(key)` helper (returns config or null)
- Include **design tokens** per direction (not global tokens; experiment tokens):
  - Typography intent tokens (used by CSS variables): e.g. `--exp-h1-size`, `--exp-h1-tracking`, `--exp-body-leading`, `--exp-eyebrow-tracking`, `--exp-case-headline`, etc.
  - Motion intent tokens (used by Framer Motion in the client component): durations + easing names/curves, plus feature toggles like `enableParallax`, `enableChapterCuts`, `enableSectionReveal`.

**Acceptance criteria**
- `src/components/experiments/directions.ts` is the only place that knows the list of directions and their slugs.
- Both `/experiments` index and subpages can import it to stay consistent.

---

## TC-EXP-04 — Add dynamic subpage route `/experiments/[direction]` (validated)
**Objective**
Create the 3 subpages using one codepath, with strict validation.

**Files**
- Add: `src/app/(site)/experiments/[direction]/page.tsx`

**Steps**
- In `src/app/(site)/experiments/[direction]/page.tsx`:
  - Validate `params.direction` using `getDirection()` from `src/components/experiments/directions.ts`.
  - If invalid, return `notFound()` (Next.js).
  - Render the shared demo component, passing the direction config.

**Acceptance criteria**
- `/experiments/quiet-monument`, `/experiments/atelier-ledger`, `/experiments/rite-of-passage` render.
- Any unknown slug 404s.
- All three routes share identical module structure (no copy divergence in route files).

---

## TC-EXP-05 — Build the shared demo page (IDENTICAL content) + direction switcher
**Objective**
Create one demo experience whose *content is fixed* while styling/motion varies by direction.

**Files**
- Add: `src/components/experiments/DirectionSwitcher.tsx`
- Add: `src/components/experiments/DirectionDemoClient.tsx`

**Steps**
- `src/components/experiments/DirectionSwitcher.tsx`:
  - Renders 3 links (same order as index), highlights active direction.
  - Include a small “You’re viewing: …” label and quick hop links.
- `src/components/experiments/DirectionDemoClient.tsx` (client component):
  - Uses `framer-motion` for direction-aware motion (entrances, overlay settle, etc.).
  - Uses `useReducedMotion()` (Framer) to enforce reduced motion behavior.
  - Renders a **fixed content set** (same text + same image + same structure always), e.g.:
    1) Hero (image + scrim + eyebrow + H1 + deck + two CTAs)
    2) Section intro (editorial lead)
    3) Card grid (3–6 cards)
    4) “Specs” block (small table + short note)
    5) Long-form excerpt (3–5 short paragraphs + one blockquote)
    6) Overlay trigger (“Read a note from the workshop”) to test dialog feel
    7) Micro-interaction row (links/buttons to test hover/focus)
  - Choose **one local image** already in `public/` (verify and use a stable path, e.g. `/cinematic_background_photos/p-web-10.jpg` or any existing `public/redesign-photos/...` asset).
  - Ensure headings are semantic and consistent across directions.

**Acceptance criteria**
- All three direction pages render **the same content modules** in the same order.
- The only differences are styling + motion (driven by config + `data-direction` attributes + scoped CSS).
- Keyboard focus is visible and reasonable on all interactive elements.

---

## TC-EXP-06 — Implement direction-scoped typography system via CSS variables + `.exp-*` classes
**Objective**
Make typography differences unmistakable without touching global primitives.

**Files**
- Update: `src/app/(site)/experiments/experiments.css`
- (Optional) Update: `src/app/(site)/experiments/layout.tsx` if adding experiment-only font vars

**Steps**
- In `src/app/(site)/experiments/experiments.css`:
  - Define a small set of experiment classes used by `DirectionDemoClient`:
    - `.exp-eyebrow`, `.exp-h1`, `.exp-deck`, `.exp-body`, `.exp-caption`, `.exp-quote`, `.exp-spec`, `.exp-button`, `.exp-card`
  - Define direction filters via attribute selectors on a wrapper:
    - `[data-direction="quiet-monument"] { ...vars... }`
    - `[data-direction="atelier-ledger"] { ...vars... }`
    - `[data-direction="rite-of-passage"] { ...vars... }`
  - Implement differences primarily through CSS variables (sizes, tracking, leading, font-family, text-transform).
  - Keep color + surfaces anchored to existing tokens (e.g., use `var(--color-ink)` etc.) so it still feels Perazzi-native.
- Suggested typography intent (high-level):
  - Quiet Monument: serif headlines, sentence case, low tracking; eyebrows are the only strong uppercase/tracking element.
  - Atelier Ledger: Geist-heavy clarity, minimal italics, neutral tracking; specs use mono/tabular emphasis.
  - Rite of Passage: chapter-forward cadence, larger whitespace, more dramatic (but still restrained) display sizing; italics reserved for “chapter voice” moments.

**Acceptance criteria**
- Switching between directions produces clearly different typographic rhythm (headline presence, tracking, case rules, line lengths).
- No changes to `src/components/ui/heading.tsx` or `src/components/ui/text.tsx` required.
- Works in both light/dark theme contexts (inherit from existing tokens).

---

## TC-EXP-07 — Implement direction motion primitives (Framer Motion) + reduced-motion behavior
**Objective**
Make motion differences felt, not “template-y.”

**Files**
- Update: `src/components/experiments/DirectionDemoClient.tsx`
- (Optional) Add helper: `src/components/experiments/motionPrimitives.ts`

**Steps**
- Add motion primitives that accept (directionConfig, reducedMotion):
  - `breathReveal`: soft opacity + small y-settle
  - `settle`: overlay/panel micro-scale + fade
  - `glide`: optional parallax (Quiet + Rite only; Ledger = off)
- Direction differences (keep structure identical):
  - Quiet Monument: fewer animated elements; longer settle; more stillness between moments.
  - Atelier Ledger: minimal entrance motion; fast UI transitions; parallax off.
  - Rite of Passage: stronger chapter beats (slower fades; slightly more pronounced offsets), but avoid gimmicks.
- Reduced motion:
  - If `useReducedMotion()` is true: no parallax, no sticky/pin, no stagger; durations near-zero or static render.

**Acceptance criteria**
- The same page *feels* different across directions via timing/easing/what animates.
- Reduced motion produces a calm, readable, essentially static page (no “jumping”/no nausea).
- No new global motion system introduced; this is contained to experiments.

---

## TC-EXP-08 — Add an experiment-only overlay (optional but high leverage)
**Objective**
Let you compare “overlay feel” across directions (a major luxury signal).

**Files**
- Add: `src/components/experiments/ExperimentDialog.tsx`
- Update: `src/components/experiments/DirectionDemoClient.tsx`

**Steps**
- Build `ExperimentDialog` using Radix Dialog primitives (either reuse `src/components/ui/dialog.tsx` or wrap Radix directly).
- Make the overlay animation direction-aware (duration/ease/scale/y-offset) without changing global dialog primitives.
- Ensure:
  - focus trap
  - escape closes
  - click outside closes (if desired)
  - `prefers-reduced-motion` disables transitions

**Acceptance criteria**
- Overlay open/close feel clearly shifts per direction (quiet settle vs precision snap vs chapter cut).
- Keyboard and screen-reader basics are intact.

---

## TC-EXP-09 — QA pass + polish checklist
**Objective**
Make it safe and easy to evaluate.

**Files**
- Update as needed: `src/app/(site)/experiments/*`, `src/components/experiments/*`

**Steps**
- Add a tiny “How to evaluate” block on `/experiments`:
  - “Scroll once. Open the overlay once. Read the excerpt. Compare.”  
- Verify:
  - all images have `alt`
  - heading order is correct
  - focus ring visible everywhere
  - reduced motion works (manual OS setting)
  - no console errors
- Run local checks:
  - `pnpm lint`
  - `pnpm typecheck`
  - (optional) `pnpm test`

**Acceptance criteria**
- `/experiments` and all subpages are stable, accessible, and clearly differentiated.
- No changes outside the experiment subtree unless explicitly necessary.

---

## End State (definition of done)
- `/experiments` exists and links to 3 direction pages.
- The 3 direction pages share identical content and module structure, but feel meaningfully different via typography + motion.
- Reduced motion works and disables parallax/sticky/long transitions.
- No new dependencies; minimal, contained code changes.

