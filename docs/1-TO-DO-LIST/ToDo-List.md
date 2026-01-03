# HOME PAGE

## Hero Section

* [ ] Add depth zoom or breathing effect
* [ ] Multi layered entrance animation
* [ ] Fix the "Manifesto" pop-up

## Craftsmanship Journey Section

* [ ] Build a "Full Screen Story Immersion" that allows users to enter fullscreen with slides for each "Build Station" and navigate from station to station

## Need a Guide Section

* [ ] Do something visually or layout wise so it looks more intentional

## Champion Spotlight Section

* [ ] Make quote scroll as if being hand written

## CTA Section

* [ ] Correct Links:
    - Book a Fitting Slug -> `/experience#experience-booking-guide`
    - Explore Bespoke Process Slug -> `/bespoke`

---

# SHOTGUNS PAGE

## Hero Section

* [ ] Same as Home Page Hero

## Platforms & Lineages Section

* [ ] Remove bounce animation from Platform Card Hover
* [ ] Make background image not resize/jump when changing Platform Cards
* [ ] Possibly have quotes scroll like being handwritten

## Geometry of Rhythm Section

* [ ] Do something visually or layout wise so it looks more intentional

## Disciplines & Purpose Section

* [ ] Make background image not resize or jump when changing disciplines
* [ ] Figure out a better way to make the most popular models look more aesthetically pleasing

## Gauge Selection Section

* [ ] Do something visually or layout wise so it looks more intentional

## Trigger Types Section

* [ ] N/A

## Choose with Intent Section

* [ ] Do something visually or layout wise so it looks more intentional

## Engravings & Grades Section

* [ ] Make background image not resize or jump when changing engraving grades
* [ ] Find a way to map the view engraving button to load only the filtered engravings for that specific grade

# BESPOKE JOURNEY PAGE

## The Bespoke Build Section

* [ ] Create full screen story immersion that allows users to enter full screen with slides for each build step and navigate from step to step, similar to the home page, craftsmanship journey section
* [ ] Make the active step highlight be rounded-sm shape
* [ ] Map the "Begin the ritual" button to the full screen immersion
* [ ] Correct the skip step-by-step button so that it actually skips

## Need a Bespoke Guide Section

* [ ] Do something visually or layout-wise so it looks more intentional

## Atelier Team Section

* [ ] Figure out what Al wants to do with this section

# HERITAGE PAGE

## Perazzi Heritage Eras Section

* [ ] Eventually change this whole section into a full screen immersive navigatable scroller with its own route. 


[-----------------------------------------------------------]

Okay, I need your help (screenshot attached to this message in the chat for context) -- I am trying to figure out a way to make these sections feel more intentional instead of just a full screen of somewhat awkwardly laid out text. Here's some context to help you understand the purpose of each one:

---
# Context

* Each one of these sections is supposed to be a child section to the parent section that is above it on the page
* The goal of them is to somewhat add context or explain or pull together the information that is in the component sitting above it on the front-end of the website. 
* The other goal of them is to somewhat be a CTA to pull people into using the Assistant by having a ChatTriggerButton that is an automated query into the Assistant API. 

---

# Goals:

* I want to figure out a way to add to the aesthetic design of the website with this as opposed to what they currently are, which is just a bunch of text, as you can see in a screenshot of one of them as an example. 
* I also want them to be more engaging and draw the user in to interacting with the assistant. 
* At the same time, though, I don't want to draw attention away from their parent section above because this should be an addition to that, not the main attraction. 
* I really need to figure out a way to make these sections more aesthetically pleasing and beautiful in a way that ties together with the rest of the website. 
* Each one of these sections also acts as a visual break to separate the components on top and below of them. That way, there is a natural, consecutive sections within the website that feel like they're supposed to make sense. 

---

# Request for ChatGPT:

* Could you please audit them and propose a couple different ideas as to how we can level them up so to speak and make them feel not just like a wall of text But still accomplish everything that I listed in the goals section. 
* I'm not looking for a massive refactor and completely changing the way that they work. But I really do want some ideas on the layout, or the design, or the interactability, or visual language, or something.

---

# Subsection Locations & Names

## Home Page
* HomeGuideSection
    - Need a Guide?

## Shotguns Page -> `/shotguns`
* ShotgunsAdvisorySection
    - The Geometry of Rhythm
    - Gauge Selection
    - Choose with Intent

## Bespoke Page -> `/bespoke`
* BespokeGuideSection
    - Need a Bespoke Guide?

## Experience Page -> `/experience`
* ExperienceAdvisorySection
    - Visit Planning
    - Fitting Guidance
    - Meet Us on the Road

## Heritage Page -> `/heritage`
* HeritageSplitSection
    - Ask the Workshop
    - Champions Past and Present
    - Inside the Botticino Atelier










---













You are **GPT‑5.2 Codex (Heavy Reasoning)** operating inside my existing **Next.js + React + TypeScript + Tailwind** repo in VS Code.

## Mission (single-shot, end-to-end)
Implement the complete **Expandable Section Motion System (ESMS)** exactly as specified below — **from scratch to full integration** — in ONE cohesive pass. Do **not** ask me follow-up questions. Make reasonable, conservative decisions when details vary per component. Do not stop early. The result must be **polished, consistent, accessible, performant, and NOT broken**.

This is not “implement pieces.” This is “ship the product.”

---

# 1) Definition of Done (hard gate)
You are done ONLY when ALL items below are true:

### Core System
- A reusable ESMS exists as a small set of modules under `src/motion/expandable/` (or the closest existing convention).
- ESMS is **slot-based** (via `data-es="slot"` attributes), **phase-driven** (`collapsed | expanding | expanded | collapsing`), and uses a **timeline director** (sequence orchestration) so each beat is individually tunable.
- Every beat is tunable via a shared spec:
  - time scales, easing palette, per-step durations, staggers w/ max cap, distances, scales, scrim opacity, hover tease, a11y focus policy, scroll anchor policy.
- Missing slots are safe (no runtime errors; no animation crashes).

### Integration
- These components are refactored to use ESMS consistently (each has a stable `sectionId` and correct slot markup):
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

### UX Behavior
- Expand triggers: click/tap on “Read More” and/or header (configurable), hover only teases (no expand) by default.
- Collapse triggers: Close button, Escape key, optional re-click header (configurable).
- Collapse feels ~2× faster than expand (configurable).
- No “pop” at end of collapse (content finishes exiting before layout collapses).
- Expansion/collapse preserves scroll anchor (prevents scroll jump), configurable.

### Accessibility
- Keyboard: Enter/Space opens, Escape closes.
- Focus management:
  - on expand: focus Close (default)
  - on collapse: focus the original trigger (default)
- Respects `prefers-reduced-motion`:
  - no char-splitting, no parallax/prezoom, minimal transitions; near-instant.
- Trigger uses `aria-expanded` and proper semantics.

### Dev Experience
- A dev-only **Motion Playground** exists:
  - pick sectionId
  - tweak spec (sliders/inputs)
  - preview expand/collapse
  - copy/export overrides snippet
- A README exists describing the slot contract + how to add a new section + common pitfalls.

### Quality Gates
- Repo passes: typecheck + lint + tests (use whatever scripts exist).
- `next build` succeeds (or the repo’s equivalent build command).
- No console errors in dev for these sections.
- No broken imports, no unused dead code, no lingering TODOs.

---

# 2) Constraints (important)
- Do NOT upgrade Next/React or do sweeping refactors unrelated to ESMS.
- Add new deps ONLY if strictly necessary for V1. If you add any, justify them in the final summary and keep them minimal.
- Preserve existing visual design/styling as much as possible. Introduce wrappers only to avoid transform collisions.
- Avoid animating expensive properties (no heavy blur animation; prefer transform + opacity).
- Avoid animating `height: auto` directly; use FLIP/layout animations or measured height if needed.

---

# 3) North Star Product Spec (Codex-target; implement this)

## 3.1 Concept
Create a shared Expandable Section Motion System so all expandable sections feel like a single premium product.

## 3.2 State model
Each expandable section MUST have phases:
- `collapsed`
- `expanding`
- `expanded`
- `collapsing`

The system prevents double-trigger bugs (e.g., ignore open() while expanding).

## 3.3 Slot contract (data attributes)
All sections must use `data-es="..."` to identify animatable parts.

**Required slots**
- `bg` — background media layer
- `scrim-top` — top gradient overlay
- `scrim-bottom` — bottom gradient overlay
- `header-collapsed` — collapsed title/subtitle/CTA group
- `glass` — glass surface container
- `main` — primary visual/card/carousel
- `header-expanded` — expanded title/subtitle/eyebrow group
- `body` — paragraphs / rich text block
- `cta` — expanded CTA row
- `close` — close button

**Optional slots**
- `meta` — metadata cluster
- `list` — list container
- `item` — list items
- `char` — char spans for short-title char reveal (only if used)

Rules:
- Missing optional slots are fine; animator must no-op safely.
- Elements animated by ESMS must not also carry Tailwind `transform` utilities. Use wrapper divs if needed.

## 3.4 Motion choreography (must match)
### Expand timeline (collapsed → expanded)
Beat 0: Background anticipation (“pre-zoom”)
- animate `bg` scale + slight y to reduce perceived stretch.

Beat 1: Container expansion
- use layout/FLIP animation.

Beat 2: Scrims converge + collapsed header exits
- scrims move toward center and soften opacity
- collapsed header fades/shifts out

Beat 3: Glass surface enters (if present)
- opacity + scale + slight y (no heavy blur animation)

Beat 4: Expanded header reveals
- optional char-by-char ONLY for short titles AND only if not reduced-motion.

Beat 5: Main visual reveals

Beat 6: Meta reveals (if present)

Beat 7: Body reveals (paragraph/line-level; NOT per-letter)

Beat 8: Lists reveal
- stagger `item` nodes top-to-bottom
- stagger must cap total spread so long lists don’t become slow

Beat 9: CTA reveals (last)

Beat 10: Background settles to final expanded framing.

### Collapse timeline (expanded → collapsed)
Reverse sequence at ~2× speed (configurable) BUT obey:
- Content completes exits BEFORE layout collapses
- Background returns toward collapsed framing BEFORE layout collapses (anti-stretch beat)

## 3.5 Tunable Motion Spec (single source of truth)
Implement a typed spec object with:
- `timeScale.expand`, `timeScale.collapse`
- `ease.container`, `ease.surface`, `ease.reveal`, `ease.exit` (4 curves max)
- `timing.expand.<beat durations>`, `timing.collapse.<beat durations>`, `timing.layout.expand|collapse`
- `stagger.expand.items|lines|chars + maxTotal`, `stagger.collapse.items + maxTotal`
- `distance` tokens (bg offsets, header offsets, content offsets, scrim converge distance, item offsets, cta offsets)
- `scale` tokens (bgCollapsed/bgPreZoom/bgExpanded, glassFrom)
- `opacity.scrimCollapsed|scrimExpanded`
- `text.enableCharReveal`, `text.maxCharsForCharReveal`
- `hover.enabled + bgScale + scrimOpacity + ctaNudgeY`
- `a11y.focusOnExpand`, `a11y.focusOnCollapse`
- `scroll.preserveAnchor`

Implement spec layering:
`DEFAULT_SPEC` + (optional route theme) + `registry override by sectionId` + (optional runtime override from playground)

## 3.6 Scroll anchoring (must ship)
Prevent scroll-jump on expand/collapse:
- capture root top before layout change
- after layout change (next frame), compute delta and `window.scrollBy(0, delta)`
- configurable via `scroll.preserveAnchor`

## 3.7 Reduced motion (must ship)
When reduced motion:
- skip preZoom, parallax-like bg motion, and char splitting
- use minimal duration (near-instant) or quick fades

## 3.8 “Only one open at a time” (recommended)
Implement a controller/context that can be enabled globally:
- opening one section closes any other expanded section
- default: enabled (unless it breaks a page; if so, provide config flag)

## 3.9 Dev-only Motion Playground (must ship)
Add a dev-only route/page (App Router or Pages Router depending on repo):
- lists sectionIds
- shows resolved spec as JSON
- sliders/inputs for key tokens (timeScale, some durations, distances, staggers)
- preview area to open/close
- “Copy overrides” button outputs a TS snippet for the registry
This must not ship to production (guard by `NODE_ENV !== "development"` and show 404 / notFound).

---

# 4) Implementation Deliverables (create these files)
Create (or closest equivalents):

1) `src/motion/expandable/expandable-section-motion.tsx`
   - hook: `useExpandableSectionMotion(options)`
   - exports: `DEFAULT_SPEC`, `ES_SELECTORS`, types, helpers
   - orchestrates timeline using a scoped animator (useAnimate or equivalent)
   - safe no-op when slots missing
   - includes `SplitChars` helper using `Intl.Segmenter` for grapheme safety (fallback to Array.from)

2) `src/motion/expandable/expandable-section-registry.ts`
   - defines section IDs + per-section overrides
   - exports `getSectionSpec(sectionId)`

3) `src/motion/expandable/ExpandableSection.tsx`
   - adapter component or render-prop wrapper to keep section components clean
   - wires trigger/close props, passes state + helpers, ensures consistent a11y

4) `src/motion/expandable/context/ExpandableSectionController.tsx` (or similar)
   - manages “only one open” policy
   - provides register/open/close coordination

5) `src/motion/expandable/dev/MotionPlayground` route/page + components
   - dev only

6) `src/motion/expandable/README.md`

7) Tests (Vitest) in a reasonable location:
   - spec merge layering
   - stagger cap logic
   - phase machine guard behavior (no double open/close)

---

# 5) Integration instructions per listed component (do this carefully)
For each listed component:
- Ensure it’s a client component if it needs hooks (`"use client"`).
- Assign a stable `sectionId` (use these IDs):
  - `home.timelineScroller`
  - `home.marqueeFeature`
  - `shotguns.platformGrid`
  - `shotguns.disciplineRail`
  - `shotguns.triggerExplainer`
  - `shotguns.engravingGradesCarousel`
  - `bespoke.buildStepsScroller`
  - `experience.experiencePicker`
  - `experience.visitFactory`
  - `experience.bookingOptions`
  - `experience.travelNetwork`
  - `heritage.championsGallery`

- Restructure markup minimally to match slot contract:
  - separate background and scrims from content
  - add collapsed header group + “Read More”
  - add expanded header group + close + content slots
  - keep existing UI inside `main/meta/body/list/item` as appropriate
- Ensure collapse/expand doesn’t break layout and doesn’t introduce transform conflicts.
- Add a spec override ONLY if the section needs it to preserve its current feel.
- Ensure each section works without the playground or dev flags.

---

# 6) Workflow (how you must execute this)
1) Scan the repo:
   - determine router type (App Router vs Pages Router)
   - find existing expand/collapse patterns
   - find existing framer-motion usage conventions
   - determine package manager (pnpm/npm/yarn) and available scripts

2) Implement ESMS core modules first (compile clean).

3) Add controller/context and wire it at an appropriate root (layout/provider) **without breaking SSR**.

4) Integrate the 12 sections one by one.
   - After each integration, ensure TypeScript types + imports are clean.
   - Keep changes local; don’t refactor unrelated code.

5) Implement Motion Playground dev route.
   - Must not ship in production.

6) Add tests.

7) Run full quality gates and fix until green:
   - lint
   - typecheck
   - unit tests
   - build

8) Final pass:
   - remove dead code
   - ensure consistent naming
   - ensure no console errors
   - verify reduced-motion mode behavior

---

# 7) Final response format (what you output to me when finished)
When done, output:
- Summary of what you built (1–2 paragraphs)
- Checklist proving “Definition of Done” is satisfied
- List of files created/modified
- Any new deps added (and why)
- Commands run + their results (or the closest available in your environment)
- Notes on how to tune a specific section via registry overrides

---

## Now start and complete the full implementation. No partial delivery.
