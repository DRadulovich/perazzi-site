## A) Target Contract

This is the implementable “contract” I will standardize all 12 sections to, based on your target spec.

### State machine

**Public state:** `collapsed | expanded`
**Internal phases (for sequencing + “no pop” collapse):**

1. `collapsed` (default)
2. `prezoom` (expand only): background framing adjusts **before** container expands
3. `expanded` (container is expanded; foreground content reveals via child variants)
4. `closingHold` (collapse only): children exit **while container stays expanded**
5. back to `collapsed` (container returns to collapsed height after exits complete)

**Expand flow**
`collapsed → prezoom → expanded`

**Collapse flow**
`expanded → closingHold → collapsed`

Why the extra phases: it’s the cleanest way to guarantee (a) the background pre-zoom beat happens before layout expansion, and (b) collapse doesn’t “snap” the container before exit animations finish.

---

### Required / optional nodes (standard section anatomy)

Every section maps to these slots. If a slot doesn’t exist in a component, it’s simply omitted (no fake DOM, no forced wrappers).

**Required**

* `background` (media layer) — supports optional parallax and prezoom scale/y
* `scrimTop` + `scrimBottom` — animated gradients that “converge” on expand
* `collapsedHeader` — title/subtitle + “Read More” CTA (centered)
* `expandedHeader` — title/subtitle/eyebrow + Close control
* `content` — component-specific UI (cards, lists, rails, etc.)
* `ctaRow` — buttons/links row (if present in the component)

**Optional**

* `glass` — foreground glass container/card stack wrapper
* `mainVisual` — hero card/image/video inside expanded view
* `meta` — eyebrow/title/subtitle blocks inside cards
* `atmosphere` — film grain, extra overlays (if a component already has them)

---

### Standard variant names

These are the **variant keys** each component will standardize on (even if internally it uses different wrappers today). The goal is that every section can be read like: “background → scrims → headers → content → CTA”.

* `section` (container / layout root)
* `background`
* `scrimTop`
* `scrimBottom`
* `collapsedHeader`
* `glass` (optional)
* `expandedHeader`
* `mainVisual` (optional)
* `meta` (optional)
* `content`
* `ctaRow`

**Variant states (consistent across all slots)**

* `collapsed`
* `prezoom` (background-only meaningful; others typically same as `collapsed`)
* `expanded`
* `closingHold` (exit phase while container remains expanded)

---

### Timing model (single-file knobs + base step map)

All timings come from one module. Everything is computed like:

* `expandMs = baseMs * EXPAND_TIME_SCALE`
* `collapseMs = baseMs * COLLAPSE_TIME_SCALE`
* default: `COLLAPSE_TIME_SCALE = EXPAND_TIME_SCALE * 0.5`

**Centralized values**

* `EXPAND_TIME_SCALE`
* `COLLAPSE_TIME_SCALE`
* Easing curves (at least: cinematic ease, soft ease, micro easeOut)
* Base durations per step
* Stagger knobs:

  * `STAGGER_HEADER_ITEMS`
  * `STAGGER_BODY_ITEMS`
  * `STAGGER_LIST_ITEMS`
  * `STAGGER_LETTERS`

**Base step durations (recommended starting point, tunable via scale)**

* Step 0: `PREZOOM_MS` = **180ms** (target spec: 120–220ms)
* Step 1: `CONTAINER_EXPAND_MS` = **820ms**
* Step 2: `SCRIM_CONVERGE_MS` = **820ms**
* Step 3: `GLASS_MS` = **550ms**
* Step 4: `EXPANDED_HEADER_MS` = **550ms**
* Step 5–9 (main/meta/body/list/cta): **550ms** each (with staggers)

**Default staggers**

* `STAGGER_HEADER_ITEMS` = **120ms**
* `STAGGER_BODY_ITEMS` = **100ms**
* `STAGGER_LIST_ITEMS` = **120ms** (overrideable per component, but default is standard)
* `STAGGER_LETTERS` = **15ms** (short strings only)

---

### Do-not-do list (hard constraints)

* **Do not** animate `height: auto` directly for the main expand/collapse container. Use **layout animation** or measured numeric height.
* **Do not** run per-letter animation on long strings or body text. Letters only for short titles/subtitles, and disabled in reduced motion.
* **Do not** expand-on-hover by default. Hover may “tease” only (scrim/brightness/etc.).
* **Do not** unmount critical nodes mid-transition in a way that causes a pop. Use exit completion gating (`closingHold`) to keep the container stable until exits finish.
* **Do not** keep scroll-linked parallax enabled in reduced motion.

---

## B) Current State Synthesis (from your audit only)

### Matrix: Component × behaviors

Legend: any “UNKNOWN” means the audit didn’t explicitly specify it and I will not assume.

| Component                              | Trigger model                                                           | Container expansion method                                                                       | Background motion                                                                                                                    | Scrims / overlays                                                                                                               | Reveal + stagger style                                                                                                                                                             | CTA reveal behavior                                                                                                                   | Reduced motion handling                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home/timeline-scroller.tsx`           | Expand/collapse triggers **UNKNOWN** (collapsed/expanded states exist)  | Uses **layoutId** for title/subtitle (`:133`, `:419`) and “layout transitions” dominate (2000ms) | Expand: scale `1.32→1` **2000ms** (`:145`, `:328`)<br>Collapse: `1→1.32` **1050ms** (`:146`, `:331`)                                 | “Atmosphere overlays” 4 layers opacity shift **2000ms** (`:126`, `:344`)                                                        | Header items: opacity/y/blur **550ms**, **120ms stagger** (`:249`, `:418`)<br>Body items: opacity/y/blur **550ms**, **100ms stagger** (+ nested delays) (`:249`, `:259`)           | CTA specifics **UNKNOWN** (collapsed state includes CTA per spec but audit doesn’t detail)                                            | `enableTitleReveal` desktop-only + disabled by `useReducedMotion`; otherwise renders expanded and `motionEnabled` disables variants/layout (per audit note) |
| `home/marquee-feature.tsx`             | Expand/collapse triggers **UNKNOWN** (has collapsed “Read more” prompt) | Uses **layoutId** for title/subtitle (`:87`, `:372`)                                             | Expand: background scale `1.32→1` **2000ms** (`:99`, `:260`)<br>Collapsed state has scroll-linked parallax y `0→16%` (`:89`, `:262`) | Atmosphere overlays 4 layers **2000ms** (`:82`, `:277`)                                                                         | Header items: **800ms**, **120ms stagger** (`:161`, `:366`)<br>Body items: **800ms**, **100ms stagger** (`:171`, `:346`)                                                           | CTA link reveal: starts ~**360ms**, **800ms** (`:181`, `:424`)<br>Collapsed “Read more” also animates in on collapse (`:181`, `:505`) | Desktop-only `enableTitleReveal`, disabled by reduced motion; `motionEnabled` disables variants/layout + parallax (per audit note)                          |
| `shotguns/PlatformGrid.tsx`            | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:444`, `:713`)                                                | Expand bg scale `1.32→1` **2000ms** (`:456`, `:615`)<br>Collapse `1→1.32` **1050ms** (`:457`, `:615`)                                | Atmosphere overlays **2000ms** (`:436`, `:633`)                                                                                 | Header items: **800ms**, stagger formula w/ groups (`:478`, `:498`)<br>Body sections appear **120ms apart** (`:508`, `:519`)<br>Tabs stagger **270ms** (`:133`, `:143`)            | Collapse “Read more” is **delayed 2000ms**, duration **500ms** (`:441`, `:810`)                                                       | Desktop-only `enableTitleReveal`, reduced motion disables variants/layout + spring highlight                                                                |
| `shotguns/DisciplineRail.tsx`          | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:392`, `:694`)                                                | Expand bg scale **2000ms** (`:404`, `:609`)<br>Collapse bg **1050ms** (`:405`, `:609`)                                               | Atmosphere overlays **2000ms** (`:383`, `:622`)                                                                                 | Header items: **820ms**, **120ms stagger** (`:485`, `:699`)<br>Category list items stagger **100ms** (`:527`, `:537`)<br>Nested discipline items stagger **80ms** (`:542`, `:877`) | Collapse “Read more” **delayed 2000ms**, **500ms** (`:389`, `:791`)                                                                   | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout + spring highlight                                                                |
| `shotguns/TriggerExplainer.tsx`        | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:93`, `:460`)                                                 | Expand bg scale **2000ms** (`:105`, `:364`)<br>Collapse bg **1050ms** (`:106`, `:364`)                                               | Atmosphere overlays **2000ms** (`:87`, `:381`)                                                                                  | Header items: **800ms**, **120ms stagger** (`:156`, `:466`)<br>Body items: **800ms**, **100ms stagger** (+ nested delays) (`:190`, `:210`)                                         | Collapsed header items animate on collapse (`:161`, `:531`)                                                                           | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout; mobile has Collapsible-only details panel                                        |
| `shotguns/EngravingGradesCarousel.tsx` | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:217`, `:511`)                                                | Expand bg **2000ms** (`:229`, `:426`)<br>Collapse bg **1050ms** (`:230`, `:426`)                                                     | Atmosphere overlays **2000ms** (`:208`, `:440`)                                                                                 | Categories stagger **250ms** (`:352`, `:362`)<br>Nested grade items stagger **80ms** (`:367`, `:685`)<br>Grade card content stagger **100ms** (`:787`, `:811`)                     | Collapse “Read more” **delayed 2000ms**, **500ms** (`:214`, `:607`)                                                                   | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout + spring highlight                                                                |
| `bespoke/BuildStepsScroller.tsx`       | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:153`, `:571`)                                                | Expand bg **2000ms** (`:173`, `:491`)<br>Collapse bg **1050ms** (`:174`, `:491`)                                                     | Atmosphere overlays **2000ms** (`:146`, `:506`)                                                                                 | Header items: **820ms**, **120ms stagger** (`:229`, `:568`)<br>Rail items stagger **60ms** (`:279`, `:298`)                                                                        | Collapse “Read more” is **not delayed 2s** (starts ~420ms) (`:696`)                                                                   | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout + spring highlight                                                                |
| `experience/ExperiencePicker.tsx`      | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:159`, `:418`)                                                | Expand bg **2000ms** (`:171`, `:334`)<br>Collapse bg **1050ms** (`:172`, `:334`)                                                     | Atmosphere overlays **2000ms** (`:152`, `:348`)                                                                                 | Cards stagger **250ms** (`:258`, `:606`)<br>FAQ reveal delay computed from card count (`:182`, `FAQList.tsx:68`)<br>FAQ list items stagger **150ms** (`:186`, `FAQList.tsx:53`)    | Collapsed “Read more” appears without 2s delay (`:525`)                                                                               | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout; FAQ motion depends on `motionOverrides.mode` (audit note)                        |
| `experience/VisitFactory.tsx`          | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:101`, `:385`)                                                | Expand bg **2000ms** (`:113`, `:310`)<br>Collapse bg **1050ms** (`:114`, `:310`)                                                     | Dual scrims + grain/gradient **1200ms** with delays: focus starts **240ms**, fade starts **360ms** (`:124-125`, `:333`, `:325`) | Detail blocks stagger **120ms** (`:229`, `:239`)                                                                                                                                   | Collapsed “Read more” appears without 2s delay (`:494`)                                                                               | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout; scrims fall back static (audit note)                                             |
| `experience/BookingOptions.tsx`        | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:89`, `:374`)                                                 | Expand bg **2000ms** (`:101`, `:299`)<br>Collapse bg **1050ms** (`:102`, `:299`)                                                     | Dual scrims + grain/gradient **1200ms** with delays (`:112-113`, `:320`, `:313`)                                                | Option cards stagger **100ms** (`:217`, `:227`)                                                                                                                                    | Collapsed “Read more” appears without 2s delay (`:477`)                                                                               | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout; scrims static                                                                    |
| `experience/TravelNetwork.tsx`         | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:134`, `:419`)                                                | Expand bg **2000ms** (`:146`, `:345`)<br>Collapse bg **1050ms** (`:147`, `:345`)                                                     | Dual scrims + grain/gradient **1200ms** with delays (`:158-159`, `:367`, `:360`)                                                | List waits for wrapper animation then items stagger **200ms** (`:604`, `:654`)                                                                                                     | Collapsed “Read more” appears without 2s delay (`:525`)                                                                               | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout + spring highlight                                                                |
| `heritage/ChampionsGallery.tsx`        | Expand/collapse triggers **UNKNOWN**                                    | Uses title/subtitle **layoutId** (`:137`, `:458`)                                                | Expand bg **2000ms** (`:149`, `:384`)<br>Collapse bg **1050ms** (`:150`, `:384`)                                                     | Dual scrims + grain/gradient **1200ms** with delays (`:161-162`, `:406`, `:399`)                                                | Filter pills stagger **100ms** (`:266`, `:607`)<br>Champion list items stagger **100ms** (`:302`, `:27`)                                                                           | Collapsed “Read more” appears without 2s delay (`:558`)                                                                               | Desktop-only `enableTitleReveal`; reduced motion disables variants/layout + spring highlight                                                                |

---

### Clusters / patterns

**1) “Atmosphere overlays” cluster (4 layers, 2000ms)**

* timeline-scroller (`src/components/home/timeline-scroller.tsx:126`, `:344`)
* marquee-feature (`src/components/home/marquee-feature.tsx:82`, `:277`)
* PlatformGrid (`src/components/shotguns/PlatformGrid.tsx:436`, `:633`)
* DisciplineRail (`src/components/shotguns/DisciplineRail.tsx:383`, `:622`)
* TriggerExplainer (`src/components/shotguns/TriggerExplainer.tsx:87`, `:381`)
* EngravingGradesCarousel (`src/components/shotguns/EngravingGradesCarousel.tsx:208`, `:440`)
* BuildStepsScroller (`src/components/bespoke/BuildStepsScroller.tsx:146`, `:506`)
* ExperiencePicker (`src/components/experience/ExperiencePicker.tsx:152`, `:348`)

**2) “Dual scrim focus/fade” cluster (1200ms + 240/360ms delays)**

* VisitFactory (`src/components/experience/VisitFactory.tsx:124-125`, `:333`, `:325`)
* BookingOptions (`src/components/experience/BookingOptions.tsx:112-113`, `:320`, `:313`)
* TravelNetwork (`src/components/experience/TravelNetwork.tsx:158-159`, `:367`, `:360`)
* ChampionsGallery (`src/components/heritage/ChampionsGallery.tsx:161-162`, `:406`, `:399`)

**3) “2-second delayed Read more” outliers (conflicts with target collapsed-state contract)**

* PlatformGrid collapse prompt: `src/components/shotguns/PlatformGrid.tsx:441`, `:810`
* DisciplineRail collapse prompt: `src/components/shotguns/DisciplineRail.tsx:389`, `:791`
* EngravingGradesCarousel collapse prompt: `src/components/shotguns/EngravingGradesCarousel.tsx:214`, `:607`

**4) Shared micro-motion language**

* Highlight pill spring is consistent: stiffness 260 / damping 30 / mass 0.7 (e.g. `timeline-scroller.tsx:727`, `PlatformGrid.tsx:178`, `DisciplineRail.tsx:895`, `EngravingGradesCarousel.tsx:712`, `BuildStepsScroller.tsx:774`, `TravelNetwork.tsx:576`, `ChampionsGallery.tsx:610`)
* Micro hover/tap is consistently ~220ms easeOut (e.g. `PlatformGrid.tsx:173`, `BuildStepsScroller.tsx:769`, `TravelNetwork.tsx:573`, `ChampionsGallery.tsx:605`)

---

### Top 5 standardization blockers

1. **No explicit prezoom sequencing**: Background scale currently runs as a long 2000ms tween in parallel (e.g. marquee-feature `:99`, `:260`), but the target requires “prezoom completes before container expansion begins.”
2. **Two competing scrim systems**: 4-layer atmosphere overlays vs dual focus/fade scrims with delayed fades (see clusters above).
3. **Delayed collapsed CTA**: Several sections delay “Read more” by 2000ms on collapse (`PlatformGrid.tsx:810`, `DisciplineRail.tsx:791`, `EngravingGradesCarousel.tsx:607`), which contradicts “collapsed state visible includes Read More.”
4. **Reduced motion / breakpoint gating diverges from target**: audit notes many sections disable motion and/or render expanded when reduced motion or not desktop. The target contract wants a consistent collapsed/expanded interaction model with reduced-motion adjustments (not “skip the system entirely”).
5. **Missing exit animations inside nested lists**: nested accordion lists unmount with no exit in DisciplineRail (`:866`) and EngravingGradesCarousel (`:683`), which fights the “reverse the timeline cleanly” requirement.

---

## C) Proposed Architecture

The architecture goal: **shared primitives first**, then convert components one-by-one by mapping their existing DOM into the standardized slot variants.

### New shared modules / components

#### 1) `src/motion/expandableSectionMotion.ts` (single knob file)

**Responsibilities**

* Export `EXPAND_TIME_SCALE`, `COLLAPSE_TIME_SCALE`
* Export easing curves (cinematic + soft + micro)
* Export base durations for each step (prezoom, container, scrims, headers, body, lists, cta)
* Export canonical staggers (header/body/list/letters)
* Export shared spring constants for highlight pills (260/30/0.7)

**Public surface**

* Named exports only (no runtime side effects)
* A small “timeline map” object that other helpers consume

**Why this matters**

* It replaces today’s repeated 2000/1050/820/550 values scattered across 12 components with a controlled, reviewable tuning surface.

---

#### 2) `src/motion/useExpandableSectionTimeline.ts`

**Responsibilities**

* Implements the state machine: `collapsed → prezoom → expanded` and `expanded → closingHold → collapsed`
* Exposes:

  * `isExpanded` + `setExpanded` + `toggle`
  * `phase` (`collapsed | prezoom | expanded | closingHold`)
  * event handlers for:

    * click expand/collapse (delegated to component triggers)
    * keyboard: Enter/Space to expand, Escape to collapse
  * optional scroll anchoring behavior (prevent scroll-jump):

    * safe default approach: on expand, keep container top anchored (only scroll if needed)

**Public props/API (safe defaults)**

* `defaultExpanded?: boolean` (default false)
* `expanded?: boolean` / `onExpandedChange?: (v:boolean)=>void` (controlled option)
* `enableOutsideClickToClose?: boolean` (default false)
* `enableHoverTease?: boolean` (default true; never auto-expands)
* `collapsedHeight?: string | number` (default “~60vh” policy)
* `motionMode?: 'full' | 'reduced' | 'off'` (computed from `useReducedMotion` by default)

**Expectations from components**

* Components provide the actual UI triggers (button, header, etc.) and wire them to the hook callbacks.
* Components decide where Close lives; the hook provides the behavior.

---

#### 3) `src/motion/createExpandableSectionVariants.ts`

**Responsibilities**

* Produces standardized variants for each slot (`background`, `scrimTop`, `scrimBottom`, `collapsedHeader`, `glass`, `expandedHeader`, `content`, `ctaRow`)
* Uses the shared config and `motionMode` to:

  * disable parallax and letter-splitting in reduced motion
  * shorten or simplify transforms (fade instead of blur+translate when needed)
* Provides both expand and collapse transition objects so collapse can run at ~2x speed.

**Expectations**

* Components map their existing `motion.div`s (or nodes they can convert to motion) to these variants.
* Slots not used by a component are simply ignored.

---

#### 4) `src/motion/textReveal.ts`

**Responsibilities**

* A small utility to decide when letter animation is allowed:

  * max characters threshold (ex: <= 24 chars)
  * reduced motion disables letter mode automatically
* Provides helpers for splitting text into motion-safe units (letters/words) **without** applying it to paragraphs.

**Expectations**

* Only used for short titles/subtitles (Step 4). Never for body copy.

---

### Height expansion approach recommendation

**Primary: Framer Motion layout animation (`layout`) on the section container**

* Best fit for “expand from ~60vh to content height”
* Avoids explicit `height:auto` tweens
* Works well with `layoutId` patterns already present in your audit across many components (e.g. title/subtitle layoutId in `PlatformGrid.tsx:444`, `ExperiencePicker.tsx:159`, etc.)

**Fallback (when layout gets janky / nested scroll containers): measured numeric height**

* Use a measurement hook (ResizeObserver) to compute expanded content height and animate numeric `height`.
* Only use when layout animations cause scroll jumps or reflow thrash.

---

## D) Implementation Plan — Codex Task Cards

Below are discrete, shippable cards. Each one is intentionally narrow and testable.

---

### Task Card 00 — Add repo-level AGENTS.md for the Expandable Section Motion System

**Objective:** Give Codex persistent, repo-specific instructions so all subsequent task cards execute consistently and safely.
**Scope:**

* Create: `AGENTS.md` (repo root)
  **Plan:**

1. Create `AGENTS.md` describing the motion migration goals and constraints:

   * Target spec summary: shared timeline, phases (`collapsed → prezoom → expanded`, `expanded → closingHold → collapsed`)
   * Standard slot/variant names
   * Accessibility + performance constraints (reduced motion, no per-letter body, avoid `height:auto`)
   * “Preserve styling/structure unless required”
2. Add repo workflow instructions:

   * Determine package manager by checking lockfiles and `package.json`
   * Determine verification commands by reading `package.json` scripts
   * Always run the repo’s lint + typecheck (and tests if present) for touched files
3. Add Next.js rules:

   * Any module using React hooks must be client-safe (add `'use client'` in hook modules)
   * Avoid importing client-only modules from server components
4. Add “no new dependencies without approval.”
   **Acceptance Criteria:**

* [ ] `AGENTS.md` exists and clearly states constraints + verification expectations.
* [ ] No runtime code changes besides adding the file.
  **Risks / Notes:**
* This is intentionally “meta.” It reduces repeated context in every later prompt and matches Codex’s documented workflow.
  **Verification Steps:**
* Ask Codex (in the same thread) to summarize the loaded instructions; confirm it quotes the new `AGENTS.md`.

---

### Shared note for Task Cards 01–20 (Codex execution pattern)

For every task below, Codex should:

* Read `AGENTS.md` first.
* Open/tag the files listed in **Scope**.
* Infer UNKNOWNs by **searching the repo** (don’t guess APIs).
* Run verification commands by reading `package.json` scripts (don’t assume `pnpm` vs `npm`).
  Codex works better when it can verify changes via lint/tests/build. ([OpenAI Developers][1])

---

### Task Card 01 — Add shared motion config (single knob file)

**Depends on:** Task Card 00
**Objective:** Centralize timing, easing, and stagger knobs for the expandable motion system in one module.
**Scope:**

* New file: `src/motion/expandableSectionMotion.ts`
  **Plan:**

1. Create a constants-only module (no React hooks, no side effects).
2. Export:

   * `EXPAND_TIME_SCALE`, `COLLAPSE_TIME_SCALE`
   * base durations for timeline steps (including prezoom)
   * default staggers (header/body/list/letters)
   * canonical easings (include the cubic-bezier used in current components)
   * shared highlight spring constants (260/30/0.7), matching audit patterns
3. Document intended usage at the top of the file (short comment).
   **Acceptance Criteria:**

* [ ] One module exports the shared knobs needed by the system.
* [ ] No existing component imports it yet (zero behavior change).
  **Risks / Notes:**
* Keep it boring. The point is consistency + future tunability.
  **Verification Steps:**
* Run repo typecheck (script name UNKNOWN; infer from `package.json`).

---

### Task Card 02 — Implement expandable section timeline controller hook

**Depends on:** Task Card 00, 01
**Objective:** Provide a shared state machine that enforces prezoom-before-expand and exit-before-collapse (“closingHold”).
**Scope:**

* New file: `src/motion/useExpandableSectionTimeline.ts`
  **Plan:**

1. Create a hook that exposes:

   * `expanded` boolean (controlled + uncontrolled support)
   * `phase`: `collapsed | prezoom | expanded | closingHold`
   * `open()`, `close()`, `toggle()`
2. Implement sequencing rules:

   * Expand: `collapsed → prezoom → expanded`
   * Collapse: `expanded → closingHold → collapsed` (container collapse must wait for exits)
3. Add keyboard support helpers:

   * Enter/Space triggers open (when focus is on trigger)
   * Escape triggers close (when expanded)
4. Make the module client-safe:

   * Add `'use client'` at file top (since it uses hooks)
5. Add safety for rapid toggles:

   * Cancel/override pending timers/animation completions
     **Acceptance Criteria:**

* [ ] Hook can be dropped into a client component without additional infrastructure.
* [ ] Rapid open/close doesn’t leave phase stuck.
  **Risks / Notes:**
* Don’t hardcode `setTimeout` values without referencing shared timing knobs.
  **Verification Steps:**
* Minimal harness is OK (temporary dev-only component) *only if* it doesn’t ship; otherwise verify by wiring into the pilot component later.

---

### Task Card 03 — Create slot-based variants factory

**Depends on:** Task Card 00, 01, 02
**Objective:** Standardize Framer Motion variants for the shared slot anatomy and shared timeline phases.
**Scope:**

* New file: `src/motion/createExpandableSectionVariants.ts`
  **Plan:**

1. Export a factory that returns variants for standard slots:

   * `background`, `scrimTop`, `scrimBottom`, `collapsedHeader`, `glass`, `expandedHeader`, `content`, `ctaRow`
2. Encode phase rules:

   * `background` must meaningfully animate on `prezoom`
   * other slots typically stay in collapsed until `expanded`
   * exit animations run during `closingHold`
3. Use shared timing knobs from `expandableSectionMotion.ts`.
4. Add reduced-motion handling:

   * disable parallax transforms
   * avoid blur-heavy motion
   * disable letter-based reveal (handled via Task 04)
     **Acceptance Criteria:**

* [ ] Variants exist for all slots; unused slots can be ignored by components.
* [ ] Collapse transitions use `COLLAPSE_TIME_SCALE` (snappier reverse).
  **Risks / Notes:**
* Don’t force a specific DOM structure. The factory supports mapping existing nodes to slots.
  **Verification Steps:**
* Typecheck the module; no runtime usage yet.

---

### Task Card 04 — Add safe short-text reveal utility (letters only for short strings)

**Depends on:** Task Card 00, 01
**Objective:** Provide a utility to enable letter reveal for short titles only, automatically disabled in reduced motion.
**Scope:**

* New file: `src/motion/textReveal.ts`
  **Plan:**

1. Add helper: `shouldUseLetterReveal(text, reducedMotion)` with a conservative max length.
2. Add helper to split text into renderable units (letters/words) while preserving accessibility:

   * Ensure screen readers still read the full string once (avoid stuttering).
3. Document “do not use on paragraphs/body copy.”
   **Acceptance Criteria:**

* [ ] Utility defaults to “off” for long strings and reduced-motion contexts.
* [ ] No production component adopts it yet (pure primitive).
  **Risks / Notes:**
* Node explosion is the enemy. Keep the threshold low.
  **Verification Steps:**
* Typecheck.

---

### Task Card 05 — Pilot migration: `home/marquee-feature` onto shared timeline

**Depends on:** Task Card 00–04
**Objective:** Validate the shared system by migrating one component end-to-end with minimal design changes.
**Scope:**

* `src/components/home/marquee-feature.tsx`

  * Background: `:99`, `:260`
  * Overlays: `:82`, `:277`
  * layoutId title/subtitle: `:87`, `:372`
  * Header/body/CTA reveal: `:161`, `:171`, `:181`
  * Parallax: `:89`, `:262`
    **Plan:**

1. Before editing, Codex must:

   * scan the file for existing `enableTitleReveal`, `motionEnabled`, `useReducedMotion`, and any wrapper components used
   * identify triggers (expand/collapse controls) **from the existing code** (audit didn’t specify)
2. Replace local timing constants with shared config + slot variants:

   * keep the same *end states* (e.g., collapsed bg scale ≈ 1.32 and expanded ≈ 1.0 per audit)
   * change sequencing so prezoom completes before container expansion
3. Wire the state machine:

   * use `useExpandableSectionTimeline` for phase transitions
   * ensure collapse uses `closingHold` so exits finish before container collapses
4. Preserve parallax behavior but gate it:

   * disabled when prefers-reduced-motion is true
5. Do **not** redesign markup; map existing nodes to slot variants.
   **Acceptance Criteria:**

* [ ] Prezoom is visibly before container expansion (ordering correctness).
* [ ] Collapse is faster and does not “pop” at the end.
* [ ] Reduced motion disables parallax + letter reveal (if introduced).
* [ ] No functional changes to links/buttons besides wiring interactions.
  **Risks / Notes:**
* This component reportedly keeps collapsed view mounted in some modes; keep that behavior unless it breaks the shared timeline.
  **Verification Steps:**
* Run dev server and manually test expand/collapse + reduced motion.
* Run lint/typecheck scripts (infer from `package.json`). Codex performs better when it can verify. ([OpenAI Developers][1])

---

### Task Card 06 — Post-pilot tune: finalize shared timing map + slot compatibility

**Depends on:** Task Card 00–05
**Objective:** Refine shared primitives based on the pilot so future migrations are predictable and low-risk.
**Scope:**

* `src/motion/expandableSectionMotion.ts`
* `src/motion/createExpandableSectionVariants.ts`
* `src/motion/useExpandableSectionTimeline.ts`
  **Plan:**

1. Adjust base durations/staggers only if the pilot exposed mismatches (e.g., prezoom too subtle/long).
2. Ensure `closingHold` truly gates container collapse until exit completes.
3. Add tiny escape hatches if needed:

   * optional “mount strategy” flag (always mounted vs AnimatePresence)
   * optional per-component overrides for collapsed/expanded background framing
4. Keep API minimal; avoid adding knobs that aren’t needed by at least 2 components.
   **Acceptance Criteria:**

* [ ] Pilot component still works after tuning (no regressions).
* [ ] Shared APIs remain small and consistent.
  **Risks / Notes:**
* Over-configuring early creates a swamp of one-off settings.
  **Verification Steps:**
* Re-test marquee-feature expand/collapse + reduced motion.

---

### Task Card 07 — Migrate `shotguns/TriggerExplainer` to shared timeline

**Depends on:** Task Card 00–06
**Objective:** Migrate a second “atmosphere overlays” component to confirm the pattern holds across layouts and nested collapsibles.
**Scope:**

* `src/components/shotguns/TriggerExplainer.tsx`

  * Background: `:105`, `:364`
  * Overlays: `:87`, `:381`
  * Header/body reveals: `:156`, `:190`
  * Mobile Collapsible refs: `src/components/ui/collapsible.tsx:21`, `src/styles/site-theme.css:716/727`
    **Plan:**

1. Identify current triggers and `enableTitleReveal` gating in-file (UNKNOWN from audit).
2. Convert outer expand/collapse to shared timeline/variants.
3. Keep mobile Collapsible behavior, but ensure it:

   * doesn’t animate `height:auto` directly if the Collapsible implementation does numeric measurement already (audit suggests it animates to “content height”)
   * respects reduced motion (no blur-heavy transitions)
4. Keep internal stagger patterns similar, but driven by shared knobs.
   **Acceptance Criteria:**

* [ ] Outer expand/collapse aligns with shared ordering and no pop.
* [ ] Mobile details toggle remains functional.
* [ ] Reduced motion disables heavy transforms; interaction still works.
  **Risks / Notes:**
* Avoid “desktop-only = animated; else render expanded” unless that is still explicitly desired in target behavior.
  **Verification Steps:**
* Test both mobile and desktop breakpoints.
* Test Escape closes when expanded.

---

### Task Card 08 — Migrate `bespoke/BuildStepsScroller` + fix `height: auto` step detail animation

**Depends on:** Task Card 00–06
**Objective:** Migrate outer expand/collapse and remove `height:auto` animation for step detail panels.
**Scope:**

* `src/components/bespoke/BuildStepsScroller.tsx`

  * Step detail height `0 → auto`: `:883`, `:890`
  * Outer background/overlays: `:173`, `:146`, `:506`
    **Plan:**

1. Convert outer section to shared timeline/variants.
2. For step detail panels:

   * replace `height: auto` animation with either `layout` or measured numeric height
   * keep duration ≈ 250ms (audit)
3. Preserve rail highlight spring and micro interactions.
   **Acceptance Criteria:**

* [ ] Step detail panels no longer animate to/from `height:auto`.
* [ ] Outer section follows shared timeline.
* [ ] Reduced motion path is stable.
  **Risks / Notes:**
* Measurements must handle dynamic content without jump.
  **Verification Steps:**
* Toggle step details rapidly; no jitter or stuck heights.

---

### Task Card 09 — Migrate `experience/ExperiencePicker` and normalize FAQ reveal gating

**Depends on:** Task Card 00–06
**Objective:** Replace bespoke computed FAQ delays with shared list reveal conventions.
**Scope:**

* `src/components/experience/ExperiencePicker.tsx` (`:182`, `:258`, `:606`)
* `src/components/experience/FAQList.tsx` (`:53`, `:68`)
  **Plan:**

1. Convert outer section to shared timeline/variants.
2. Remove “FAQ delay computed from card count” timing logic:

   * Instead, map FAQ heading + items into shared content/list reveal phases
3. Keep per-FAQ Collapsible behavior; ensure reduced motion is respected.
   **Acceptance Criteria:**

* [ ] FAQ reveal timing no longer depends on card count math.
* [ ] FAQ items stagger consistently top-to-bottom.
* [ ] No per-letter animation for FAQ bodies.
  **Risks / Notes:**
* This changes timing feel slightly, but improves standardization and predictability.
  **Verification Steps:**
* Vary number of cards (if possible) and confirm FAQ reveal remains stable.

---

### Task Card 10 — Migrate `shotguns/PlatformGrid` and remove 2s delayed “Read more”

**Depends on:** Task Card 00–06
**Objective:** Align collapsed CTA behavior with the target contract (“Read More” visible in collapsed state, not delayed).
**Scope:**

* `src/components/shotguns/PlatformGrid.tsx`

  * delayed “Read more”: `:441`, `:810`
  * tabs/cards animations: `:133`, `:368`, `:371`, `:374`
    **Plan:**

1. Convert outer expand/collapse to shared timeline/variants.
2. Remove the 2000ms delayed collapsed CTA; collapsed prompt should appear immediately when collapsed.
3. Preserve tab highlight spring and card swap behavior; only migrate constants to shared config if safe.
   **Acceptance Criteria:**

* [ ] Collapsed “Read more” is visible immediately in collapsed state.
* [ ] Tab interactions still work and remain smooth.
  **Risks / Notes:**
* Don’t accidentally change layoutId behavior for title/subtitle.
  **Verification Steps:**
* Collapse and confirm CTA appears promptly; switch tabs; confirm no regressions.

---

### Task Card 11 — Migrate `shotguns/DisciplineRail` and remove 2s delayed “Read more”

**Depends on:** Task Card 00–06
**Objective:** Standardize outer timeline and fix delayed CTA in collapsed state.
**Scope:**

* `src/components/shotguns/DisciplineRail.tsx`

  * delayed “Read more”: `:389`, `:791`
    **Plan:**

1. Convert outer expand/collapse to shared timeline/variants.
2. Remove delayed collapsed CTA; show immediately when collapsed.
3. Leave nested category list exit behavior unchanged (handled next card).
   **Acceptance Criteria:**

* [ ] Outer expand/collapse matches shared timeline.
* [ ] Collapsed CTA is not delayed.
  **Risks / Notes:**
* Keep this card focused; nested exit improvements belong to Task 12.
  **Verification Steps:**
* Expand/collapse and verify CTA + basic category behavior still works.

---

### Task Card 12 — Add nested discipline list exit animation (DisciplineRail)

**Depends on:** Task Card 11
**Objective:** Prevent nested discipline items from disappearing abruptly on category close.
**Scope:**

* `src/components/shotguns/DisciplineRail.tsx`

  * nested list unmount no exit: `:866`
    **Plan:**

1. Wrap nested list rendering in an exit-capable pattern (e.g., AnimatePresence).
2. Add exit variants consistent with shared list exit timing (collapse speed scale).
3. Ensure reduced motion avoids blur/translate and uses opacity-only exit.
   **Acceptance Criteria:**

* [ ] Closing a category animates nested items out (no abrupt pop).
* [ ] Reduced motion path behaves cleanly.
  **Risks / Notes:**
* Avoid animating huge lists expensively; keep exit simple.
  **Verification Steps:**
* Open/close categories repeatedly; confirm no stuck UI.

---

### Task Card 13 — Migrate `shotguns/EngravingGradesCarousel` and remove 2s delayed “Read more”

**Depends on:** Task Card 00–06
**Objective:** Standardize outer timeline and fix delayed collapsed CTA; preserve grade-card internal behavior.
**Scope:**

* `src/components/shotguns/EngravingGradesCarousel.tsx`

  * delayed “Read more”: `:214`, `:607`
  * grade swap + content stagger: `:748`, `:787`, `:811`
    **Plan:**

1. Convert outer expand/collapse to shared timeline/variants.
2. Remove delayed collapsed CTA.
3. Preserve grade selection swap and internal content stagger; only align durations/eases via shared config.
   **Acceptance Criteria:**

* [ ] Collapsed CTA not delayed.
* [ ] Grade selection still swaps smoothly.
  **Risks / Notes:**
* Nested grade list exit is handled in Task 14.
  **Verification Steps:**
* Expand/collapse, switch grades, confirm no regressions.

---

### Task Card 14 — Add nested grade list exit animation (EngravingGradesCarousel)

**Depends on:** Task Card 13
**Objective:** Remove abrupt nested list unmount on category close.
**Scope:**

* `src/components/shotguns/EngravingGradesCarousel.tsx`

  * nested list unmount no exit: `:683`
    **Plan:**

1. Add AnimatePresence + exit variants for nested grades.
2. Use shared collapse timing scale; keep exit simple (opacity/y minimal).
3. Respect reduced motion.
   **Acceptance Criteria:**

* [ ] Nested grades animate out on close.
* [ ] No visual popping.
  **Risks / Notes:**
* Keep node count manageable; don’t add letter reveals.
  **Verification Steps:**
* Open/close several categories quickly; confirm stability.

---

### Task Card 15 — Extend shared scrim variants to support “dual scrim focus/fade” pattern

**Depends on:** Task Card 00–06
**Objective:** Support both overlay systems (4-layer atmosphere vs dual focus/fade) using one standardized scrim contract.
**Scope:**

* `src/motion/createExpandableSectionVariants.ts`
* `src/motion/expandableSectionMotion.ts`
  **Plan:**

1. Add an explicit `scrimMode` option:

   * `'atmosphere'` (existing 4-layer vibe)
   * `'dualFocusFade'` (VisitFactory/BookingOptions/TravelNetwork/ChampionsGallery pattern)
2. Encode focus/fade offsets as named config values (matching audit: focus ~240ms, fade ~360ms).
3. Keep slot names unchanged (`scrimTop`, `scrimBottom`) and allow extra overlays optionally.
   **Acceptance Criteria:**

* [ ] Variants can represent both scrim modes without per-component bespoke logic.
* [ ] Existing migrated components still work (no regressions).
  **Risks / Notes:**
* Avoid abstracting so hard it becomes unreadable—explicit is better than “magical”.
  **Verification Steps:**
* Re-test already-migrated components; verify scrim behavior.

---

### Task Card 16 — Migrate `experience/VisitFactory` to shared timeline (dual scrim mode)

**Depends on:** Task Card 15
**Objective:** Validate the dual-scrim abstraction by migrating a dual-scrim section.
**Scope:**

* `src/components/experience/VisitFactory.tsx`

  * scrim focus/fade delays: `:124-125`, `:333`, `:325`
    **Plan:**

1. Convert outer expand/collapse to shared timeline/variants with `scrimMode='dualFocusFade'`.
2. Keep existing content stagger patterns, but sourced from shared config.
3. Preserve “What to expect” accordion behavior.
   **Acceptance Criteria:**

* [ ] Dual scrims behave staged (focus/fade offsets preserved).
* [ ] Expand/collapse follows shared ordering; collapse is snappy with no pop.
  **Risks / Notes:**
* Scrim feel is part of the design language—avoid flattening it.
  **Verification Steps:**
* Manual expand/collapse test; reduced motion test.

---

### Task Card 17 — Migrate `experience/BookingOptions` + fix scheduler `height:auto`

**Depends on:** Task Card 15
**Objective:** Migrate section and remove `height:auto` animation from scheduler panel.
**Scope:**

* `src/components/experience/BookingOptions.tsx`

  * scheduler height `0 → auto`: `:587`, `:591`
  * scrims: `:112-113`, `:320`, `:313`
    **Plan:**

1. Convert outer section to shared timeline/variants (`dualFocusFade`).
2. Replace scheduler panel animation with layout or measured numeric height.
3. Keep scheduler behavior aligned with ~550ms duration (audit), controlled by shared knobs.
   **Acceptance Criteria:**

* [ ] Scheduler panel no longer animates `height:auto` directly.
* [ ] Reduced motion path is stable and readable.
  **Risks / Notes:**
* Iframes can resize after load; measurement must be resilient.
  **Verification Steps:**
* Toggle scheduler open/close after it loads; watch for jump.

---

### Task Card 18 — Migrate `experience/TravelNetwork` and normalize listReady gating

**Depends on:** Task Card 15
**Objective:** Migrate section and replace bespoke “list waits for wrapper” gating with standardized list reveal timing.
**Scope:**

* `src/components/experience/TravelNetwork.tsx`

  * list gating: `:604`, `:654`
  * tab swap + highlight: `:576`, `:612`
    **Plan:**

1. Convert outer section to shared timeline/variants (`dualFocusFade`).
2. Replace “list starts after wrapper finishes + 550ms” logic with shared list reveal step timing.
3. Ensure tab swaps re-run list reveal in a controlled way (avoid re-animating huge lists aggressively).
   **Acceptance Criteria:**

* [ ] List reveal is consistent on initial expand and on tab change.
* [ ] Reduced motion disables spring highlight and heavy transforms.
  **Risks / Notes:**
* Watch performance on long lists; keep item animation minimal.
  **Verification Steps:**
* Expand, switch tabs, verify list reveal and no jank.

---

### Task Card 19 — Migrate `heritage/ChampionsGallery` to shared timeline

**Depends on:** Task Card 15
**Objective:** Standardize expand/collapse + filters/list reveals under shared slot/variant contract.
**Scope:**

* `src/components/heritage/ChampionsGallery.tsx`

  * filter/list staggers: `:266`, `:302`
  * detail panel swap: `:704`, `:709`
    **Plan:**

1. Convert outer section to shared timeline/variants (`dualFocusFade`).
2. Map filter pills and champion list to the standardized list reveal step.
3. Keep micro interactions (~220ms easeOut) and highlight spring consistent with shared config.
   **Acceptance Criteria:**

* [ ] Expand/collapse follows shared ordering.
* [ ] Filter + list reveal remains readable and not overly busy.
* [ ] Reduced motion path behaves well.
  **Risks / Notes:**
* Multi-system component: keep the migration focused on outer timeline first.
  **Verification Steps:**
* Expand/collapse; change filter; change selection; confirm no regressions.

---

### Task Card 20 — Migrate `home/timeline-scroller` outer expand/collapse to shared timeline (preserve internal stage interactions)

**Depends on:** Task Card 00–06
**Objective:** Standardize the outer section timeline while preserving complex pinned/stage behaviors unchanged.
**Scope:**

* `src/components/home/timeline-scroller.tsx`

  * outer bg/overlays: `:145`, `:126`, `:344`
  * header/body stagger: `:249`, `:259`
  * stage accordion max-height: `:648`
  * pinned panel transitions: `:795`, `:842`
    **Plan:**

1. Convert only the outer expand/collapse system to shared timeline/variants.
2. Preserve pinned-stage interactions exactly:

   * do not rewrite spring highlight, clipPath reveals, or panel swap logic
3. Ensure collapse uses `closingHold` so body exits finish before container collapses.
4. Keep reduced motion behavior consistent with the rest of the system.
   **Acceptance Criteria:**

* [ ] Outer timeline matches shared ordering and no end pop.
* [ ] Stage behaviors still function as before (pinned + stacked).
* [ ] Reduced motion does not re-enable heavy animations.
  **Risks / Notes:**
* Highest complexity component → do last, keep diff surgical.
  **Verification Steps:**
* Expand/collapse; switch stages in pinned mode; toggle accordion in stacked mode.

---

### Suggested conversion order (based on audit similarity + risk)

1. `home/marquee-feature.tsx` (pilot; has parallax + CTA)
2. `shotguns/TriggerExplainer.tsx` (similar overlay system; straightforward)
3. `bespoke/BuildStepsScroller.tsx` (adds nested height fix)
4. `experience/ExperiencePicker.tsx` (stagger + FAQ gating cleanup)
5. `shotguns/PlatformGrid.tsx` (remove delayed CTA; tabs)
6. `shotguns/DisciplineRail.tsx` → then nested exit fix
7. `shotguns/EngravingGradesCarousel.tsx` → then nested exit fix
8. Shared dual-scrim support (Task 15)
9. `experience/VisitFactory.tsx`
10. `experience/BookingOptions.tsx`
11. `experience/TravelNetwork.tsx`
12. `heritage/ChampionsGallery.tsx`
13. `home/timeline-scroller.tsx` (final boss)

---

## E) Quality Gates

### Reduced motion checklist

* [ ] Parallax disabled (e.g. marquee-feature scroll-linked y `:89`, `:262` must be gated).
* [ ] Letter-by-letter disabled entirely.
* [ ] Large blur/translate effects replaced with opacity-only or minimal motion.
* [ ] Expand/collapse still works with keyboard and click; no “render expanded by default” unless explicitly desired.

### Performance checklist

* [ ] No per-letter animation on paragraphs or long lists (node count stays sane).
* [ ] Avoid layout thrash: prefer `layout` transitions on a small number of containers.
* [ ] Keep the number of simultaneously animated layers low (especially with blur/backdrop-filter).
* [ ] Don’t re-animate huge lists unnecessarily on every small state change (watch TravelNetwork/ChampionsGallery).

### UX checklist

* [ ] Expand is click/tap (hover only teases).
* [ ] Collapse via Close control + Escape works everywhere.
* [ ] Collapse is faster (~2x) but not abrupt.
* [ ] No scroll-jump: expanding keeps the section anchored (scrollIntoView only if needed).
* [ ] “Read More” is visible immediately in collapsed state (remove 2s delayed CTA outliers).

### Definition of Done (entire migration)

* [ ] All 12 sections use the shared motion config file for timings/easing/staggers.
* [ ] All 12 sections adhere to the standardized slot variants + shared timeline phases (prezoom + closingHold).
* [ ] All 12 sections respect prefers-reduced-motion without disabling the interaction model.
* [ ] No known height:auto animation pitfalls remain in the expandable system (and any remaining internal ones are documented or fixed where relevant).
* [ ] Visual regression sweep: no component loses non-motion behavior (tabs, accordions, modals, pinned panels) unless it conflicted with the spec contract.
