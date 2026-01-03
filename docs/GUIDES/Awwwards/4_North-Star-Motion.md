# North Star Map — Expandable Section Motion System (ESMS)
Version: 1.0 (Product Goalpost)
Audience: GPT‑Codex (implementation), design + engineering (review)
Scope: Next.js + React + TS + Tailwind codebase, reuse across the listed sections

---

## 0) What “done” looks like (the end result in one paragraph)

The site ships with a single, reusable **Expandable Section Motion System** that makes every expandable/collapsible hero/feature section feel like it belongs to the same premium product universe: cinematic anticipation, clean layout expansion, coherent scrim choreography, crisp content reveals, and snappy reversals. Each animation beat (pre‑zoom, scrims, headers, glass, main, meta, body, list items, CTA) is independently tunable per section via a shared spec system—without rewriting animation code per component. The system is accessible (keyboard, focus, reduced motion), high‑performance (60fps transforms, no layout thrash, no hydration jank), and has a built‑in motion “playground” to tune timings/staggers/distances visually.

---

## 1) Product vision and experience pillars (the “Awwwards” part)

### 1.1 The user should feel:
- **Guided**: motion explains hierarchy and interaction (what is clickable, what is revealed, what changed).
- **Weight + craft**: surfaces move first, content follows; nothing jitters or pops.
- **Control**: expansion is reversible, predictable, and never traps users.
- **Speed**: collapse feels ~2× faster than expand; no waiting, no “stuck” UI.

### 1.2 The motion style:
- “Premium editorial” (not bouncy UI toy).
- Mostly **tweens** for large geometry changes + surfaces; optional subtle spring for micro elements only.
- **Easing palette is small and consistent** (4 curves max across the whole system).
- All motion defaults can be overridden *per section*.

---

## 2) Inventory: sections that MUST use this system

Refactor these components to follow the ESMS contract (slot anatomy + hook usage):

- `src/components/home/timeline-scroller.tsx`
- `src/components/home/marquee-feature.tsx`
- `src/components/shotguns/PlatformGrid.tsx`
- `src/components/shotguns/DisciplineRail.tsx`
- `src/components/shotguns/TriggerExplainer.tsx`
- `src/components/shotguns/EngravingGradesCarousel.tsx`
- `src/components/bespoke/BuildStepsScroller.tsx`
- `src/components/experience/ExperiencePicker.tsx`
- `src/components/experience/VisitFactory.tsx`
- `src/components/experience/BookingOptions.tsx`
- `src/components/experience/TravelNetwork.tsx`
- `src/components/heritage/ChampionsGallery.tsx`

Each may omit optional slots (glass, list, meta, etc.), but must preserve the slot naming contract for what it uses.

---

## 3) Non‑negotiable requirements (these are “tests” of the product)

### 3.1 Interaction & behavior
- Two primary states: `collapsed` and `expanded`, with enforced transition phases:
  - `collapsed → expanding → expanded → collapsing → collapsed`
- Expand triggers:
  - Primary: click/tap on “Read More” CTA and/or header group (configurable).
  - Hover only **teases** (does not expand) unless explicitly enabled per section.
- Collapse triggers:
  - Close button, re‑click header (if enabled), and **Escape key**.
- Optional global policy: **only one expanded section at a time** (recommended, configurable).
- Expansion must be **anchored** to prevent scroll-jump (see §8.2).

### 3.2 Accessibility (must pass)
- Full keyboard support:
  - Enter/Space activates triggers
  - Escape collapses when expanded
- Focus management:
  - On expand, focus moves to Close button (or configured target)
  - On collapse, focus returns to the trigger that opened it
- Reduced motion:
  - If `prefers-reduced-motion`, the system “downshifts”:
    - no parallax
    - no char-by-char animation
    - minimal transforms (opacity + simple y)
    - durations near-instant
- ARIA:
  - Trigger uses `aria-expanded` and (optional) `aria-controls` linking to expanded content container.

### 3.3 Performance (must hold)
- 60fps feel for the common path (transform + opacity only).
- No animating `height: auto` directly; use layout animations or measured heights.
- No layout thrash during timeline steps: avoid reading layout repeatedly mid animation.
- No transform conflicts: elements animated by ESMS must not also have Tailwind transform utility classes.
- Background media uses Next/Image or optimized video; no giant uncompressed assets.

---

## 4) Dependencies: minimum and optional

### 4.1 Minimum dependency set (ship this)
- Framer Motion / Motion for React:
  - must use a scoped animator (timeline orchestration) and reduced-motion detection
- Existing stack: Next.js, React, TS, Tailwind

### 4.2 Optional “polish upgrades” (explicitly optional)
- **Text splitting**:
  - Prefer built-in `Intl.Segmenter` for grapheme-safe char splitting.
  - If needed for robust line splitting: add SplitType (but only if line animation is essential).
- **Scroll choreography**:
  - Add GSAP + ScrollTrigger only if you want scroll-pinned/scrubbed sequences beyond basic expand/collapse.
- **Smooth scrolling**:
  - Add Lenis if the product direction is “inertia scroll” site-wide.
- **Focus trap**:
  - Add focus-trap-react only if expanded sections behave modal-like on mobile.

Codex should not add optional deps unless explicitly implementing those optional features.

---

## 5) Architecture overview (what Codex should build)

### 5.1 Core idea
A single system built around:
- a **slot contract** (DOM nodes labeled with `data-es="slot"`),
- a **motion spec** (tokens: durations, eases, staggers, distances, scales),
- a **timeline director** (orchestrates steps using selectors + phases),
- a **tiny wrapper/hook API** that each section uses identically.

### 5.2 The deliverable modules (files Codex must create)
Create a motion package under `src/motion/expandable/` (or similar):

1) `src/motion/expandable/expandable-section-motion.ts`
   - Exports:
     - `useExpandableSectionMotion(options)` hook
     - `DEFAULT_ESMS_SPEC` (global default spec)
     - `ES_SELECTORS` map (slot selectors)
     - `SplitChars` helper (grapheme-safe), optional `SplitWords`
     - Types: `ExpandablePhase`, `MotionSpec`, `SectionOverride`, etc.

2) `src/motion/expandable/expandable-section-registry.ts`
   - A single registry:
     - maps `sectionId → spec overrides`
     - maps `sectionId → interaction policy` (hover tease on/off, allow header click, etc.)
   - Provides a `getSectionSpec(sectionId)` helper.

3) `src/motion/expandable/ExpandableSection.tsx`
   - A small “adapter” component that:
     - applies root props
     - wires triggers + close props
     - optionally enforces “one expanded at a time” via context
   - This keeps individual sections lean.

4) `src/motion/expandable/dev/MotionPlaygroundPage.tsx` (or route)
   - A dev-only UI that lets you:
     - pick a section
     - tweak durations/staggers/distances live
     - preview expand/collapse
     - copy resulting overrides as JSON/TS snippet
   - This is the “make it impossible to miss the target” tool.

5) `src/motion/expandable/README.md`
   - Contract + usage guide + do/don’t list.

### 5.3 Optional but recommended
- `src/motion/expandable/context/ExpandableSectionController.tsx`
  - Manages global rule: close others when one opens
  - Handles Escape at a global level if desired

---

## 6) Slot contract (DOM anatomy that all sections must follow)

### 6.1 Slots (data attributes)
Use `data-es="..."` on the relevant nodes:

Required for all sections:
- `bg` — background media layer (image/video/gradient)
- `scrim-top` — top gradient overlay
- `scrim-bottom` — bottom gradient overlay
- `header-collapsed` — collapsed title/subtitle/CTA group
- `header-expanded` — expanded title/subtitle/eyebrow group
- `cta` — primary call-to-action row (expanded)
- `close` — close button/affordance (expanded)

Optional slots (only if used):
- `glass` — glass container / surface
- `main` — primary visual (card/image/carousel)
- `meta` — eyebrow/title/subtitle cluster or metadata
- `body` — paragraphs / rich text / explainer copy
- `list` — list container
- `item` — list items to stagger in/out
- `char` — spans produced by `SplitChars` (only for short titles)

### 6.2 Rules
- If a section has no glass, it simply omits `data-es="glass"`. The animator must safely no-op missing slots.
- Anything animated by ESMS must not also have Tailwind `transform` utilities on that same element (use wrapper divs).
- The background layer (`bg`) should be transform-only (scale/y), not reflowing.

---

## 7) Motion spec model (how tuning works)

### 7.1 Spec layers
The final resolved motion spec is computed as:
- `DEFAULT_ESMS_SPEC`
  + `RouteThemeOverrides` (optional, e.g., “heritage” feels slower than “experience”)
  + `SectionRegistryOverride(sectionId)`
  + `RuntimeOverride` (dev playground / query param)

This layering is key: global consistency + per-section personality.

### 7.2 What MUST be tunable (independently)
Codex must ensure each of these is adjustable without editing animation code:
- Expand scale multipliers:
  - `expandTimeScale`
  - `collapseTimeScale` (default ~0.5–0.6 of expand)
- Easing palette:
  - `container`, `surface`, `reveal`, `exit`
- Per-step durations:
  - `preZoom`, `scrim`, `headerOut`, `glassIn`, `headerIn`, `mainIn`, `metaIn`, `bodyIn`, `listIn`, `ctaIn`
  - and collapse equivalents
- Distances:
  - background y offsets, header offsets, content offsets, item offsets
- Staggers:
  - list item stagger base + max total cap
  - char stagger base + max cap
  - (optional) line stagger

### 7.3 Anti-slow rule for staggers
Long lists must not create long total animation times.
Stagger system must cap total spread (e.g., `maxTotal = 0.42s`):
- If list has 20 items, stagger step auto-reduces so total spread stays within cap.

### 7.4 Text splitting must be safe
If char animation is enabled:
- It only runs for short text (max chars threshold).
- It must respect grapheme clusters (emoji, accents).
- It is disabled under reduced motion.

---

## 8) Timeline choreography (the “director cut”)

### 8.1 Expand timeline (collapsed → expanded)
The director runs these beats in order:

**Beat 0 — Anticipation (pre‑zoom)**
- Animate `bg` to `scale: bgPreZoom` and slight `y` offset.
- Purpose: reduce perceived stretch during layout change.

**Beat 1 — Layout expansion**
- Expand container using layout animation (FLIP).
- Must keep section anchored to prevent scroll jump.

**Beat 2 — Scrims + collapsed header exit**
- Top and bottom scrims animate toward center and reduce opacity.
- Collapsed header fades and shifts out.

**Beat 3 — Glass surface enters (if present)**
- Glass fades/scale/blur-in (blur should be subtle; avoid heavy blur animation).

**Beat 4 — Expanded header enters**
- Expanded title/subtitle/eyebrow reveal.
- Optional char stagger for short title only.

**Beat 5 — Main visual enters**
- Card/image/carousel reveals (opacity + y + maybe slight scale).

**Beat 6 — Meta enters (if present)**

**Beat 7 — Body enters**
- Prefer paragraph/line-level reveal, not per-letter.

**Beat 8 — Items enter**
- Lists/columns/accordion items stagger in top-to-bottom.

**Beat 9 — CTA enters**
- CTA is last. Close button should be visible by the time the user expects control.

**Beat 10 — Settle**
- Background eases from preZoom into expanded framing.

### 8.2 Collapse timeline (expanded → collapsed)
Reverse with ~2× speed, but with one important rule:

**Rule: no “pop” at the end**
- Content must fully exit before the container collapses.
- Background should “anti-stretch” back toward collapsed framing BEFORE layout collapse.

Collapse order:
1) CTA + close fade out
2) Items out (reverse stagger)
3) Body + meta out
4) Main out
5) Expanded header out
6) Glass out
7) Background returns toward collapsed framing (anti-stretch beat)
8) Container collapses (layout)
9) Scrims return + collapsed header fades back in

---

## 9) Scroll anchoring (prevent scroll-jump)

When expanding/collapsing changes layout height:
- Capture the root element’s `getBoundingClientRect().top` before changing layout.
- After layout change (next animation frame), compute new top and scroll by the delta.
- This keeps the section “pinned” in place without hard locking scroll.

This behavior must be configurable:
- `preserveAnchor: true | false`

---

## 10) State & control policy

### 10.1 Local state
Each section owns:
- `isExpanded`
- `phase` (collapsed/expanding/expanded/collapsing)

### 10.2 Global “only one open” (recommended)
Implement an optional controller context:
- When a section begins expanding, controller instructs any other expanded section to close.
- This eliminates multi-open chaos and keeps the experience editorial.

### 10.3 URL sync (optional but premium)
Optional feature:
- Expanding a section can set `?section=<id>` or `#<id>`
- Page load with that param opens it
- Back button collapses it
This is a “deep link to a story beat” capability and increases shareability.

---

## 11) Accessibility & reduced motion details

### 11.1 Keyboard
- Trigger supports Enter/Space.
- Escape closes when expanded.
- “Close” is always reachable and visible.

### 11.2 Focus
Configurable focus targets:
- On expand: focus Close (default)
- On collapse: focus the trigger that opened (default)

### 11.3 Reduced motion mode
Under reduced motion:
- Skip preZoom, parallax, char split, and heavy stagger.
- Use near-instant duration (or minimal fades).
- Ensure content is still discoverable and readable.

---

## 12) Visual design integration notes (Tailwind + layout)

### 12.1 Layout mechanics
- Collapsed state visual height: ~50vh (or design token).
- Expanded height: content-driven + layout animation.
- Prefer `motion.section layout` for container morph.

### 12.2 Layering order (z-index mental model)
1) background (`bg`)
2) scrims
3) collapsed header group (in collapsed)
4) expanded content (glass/main/meta/body/list/cta/close)

### 12.3 Avoid transform collisions
Any element animated by ESMS should not have:
- Tailwind transform utilities (`translate-*`, `scale-*`, etc.) on the same node.
Instead:
- wrap it in a parent that owns layout/styling, and animate the inner node.

---

## 13) Integration plan per component (what Codex must change)

For each listed component:
1) Assign a stable `sectionId` string (e.g., `home.marquee`, `shotguns.platformGrid`).
2) Wrap the section root in `ExpandableSection` or call the hook directly.
3) Restructure markup to match slot contract:
   - ensure required slots exist
   - optional slots only if used
4) Ensure trigger and close are wired consistently.
5) Ensure background layer is separate from container expansion.
6) Confirm reduced motion behavior works (visual check + logic).
7) Confirm the section can be tuned via registry overrides.

Each section can have its own spec override in the registry:
- dense info sections: slower body + smaller distances
- image-heavy sections: slower bg settle + scrim
- list-heavy sections: smaller stagger step, keep maxTotal cap

---

## 14) Developer experience deliverables (so this stays maintainable)

### 14.1 Motion Playground (dev-only)
A page/route that:
- lists all section IDs
- shows current resolved spec
- has sliders for key tokens
- preview expand/collapse
- exports overrides snippet to paste into the registry

### 14.2 Documentation
A README that includes:
- slot contract table
- “how to add a new expandable section”
- common bugs:
  - transform collisions
  - missing slots
  - layout jump due to scroll anchoring disabled
- performance tips

### 14.3 Telemetry (optional but useful)
Emit events:
- `expand_open(sectionId)`
- `expand_close(sectionId)`
- `expand_dwell_time(sectionId, ms)`
This helps validate whether users engage or bounce.

---

## 15) QA and testing definition (acceptance criteria)

### 15.1 Manual acceptance checklist (must pass)
For every section:
- Expand works via click and keyboard
- Close works via Close button + Escape
- No scroll jump on expand/collapse (anchor preserved)
- No visual “pop” at end of collapse
- Reduced motion behaves correctly
- Mobile tap targets are sane; close is reachable
- You can tune timing/stagger/distance from registry and see effect

### 15.2 Automated tests (recommended)
- Unit tests:
  - spec merge layering produces expected output
  - stagger auto-cap works for large counts
  - phase machine prevents double-trigger bugs
- E2E tests (Playwright):
  - expand/collapse via keyboard
  - escape closes
  - focus lands correctly
  - URL sync (if implemented)

### 15.3 Performance checks
- Lighthouse / Web Vitals sanity:
  - No CLS spikes from expansion
  - GPU-friendly transforms (no expensive properties)

---

## 16) Definition of Done (Codex can use as completion gate)

The work is done when:
1) All listed sections are integrated and using ESMS consistently.
2) There is exactly one core motion system (no duplicated ad-hoc variants).
3) Every animation beat is tunable via spec (global + per section).
4) Reduced motion is respected and verified.
5) Anchor-preserving expansion/collapse is implemented and verified.
6) A motion playground exists for tuning and exporting overrides.
7) Documentation exists and a new engineer can implement a new expandable section by following it.

---

## 17) Optional V2 “Awwwards flex” (only after V1 is solid)
- Shared-element `layoutId` morphs between collapsed/expanded title + image.
- Scroll-based parallax while collapsed (disabled in reduced motion).
- ScrollTrigger-style “chapter” transitions between major sections (if product direction wants it).
- Subtle audio microfeedback (if brand-appropriate; always optional + user-controlled).

END.
