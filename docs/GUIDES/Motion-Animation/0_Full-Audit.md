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

### Task Card 01 — Add shared motion config (single knob file)

**Objective:** Centralize expandable section timing, easing, and stagger knobs into one module used by all sections.
**Scope:**

* Add new file: `src/motion/expandableSectionMotion.ts`
  **Plan:**

1. Define `EXPAND_TIME_SCALE` and `COLLAPSE_TIME_SCALE` (default collapse = expand * 0.5).
2. Add canonical easings (including the cinematic bezier used throughout the audit: `cubic-bezier(0.16,1,0.3,1)`).
3. Add base durations + staggers (prezoom, container, scrims, header/body/list/cta).
4. Add shared highlight spring constants (260/30/0.7) for consistency with existing behavior.
   **Acceptance Criteria:**

* [ ] One module exports all durations/easings/staggers used by the new system.
* [ ] No existing component behavior changes yet (no imports wired).
  **Risks / Notes:**
* Keep this file “dumb”: constants + tiny helpers only, so it stays stable.
  **Verification Steps:**
* Confirm TypeScript build passes and the module is unused (no runtime changes).

---

### Task Card 02 — Implement expandable section timeline controller hook

**Depends on:** Task Card 01
**Objective:** Create a shared state machine that sequences `prezoom → expand` and `closingHold → collapsed` without visual popping.
**Scope:**

* Add new file: `src/motion/useExpandableSectionTimeline.ts`
  **Plan:**

1. Implement phases: `collapsed`, `prezoom`, `expanded`, `closingHold`.
2. Provide `toggle`, `open`, `close` helpers.
3. Add keyboard behavior: Enter/Space open; Escape closes.
4. Add optional scroll anchoring hooks (default on for expand, conservative behavior).
   **Acceptance Criteria:**

* [ ] Hook exposes a stable API usable by a single component without needing a wrapper component.
* [ ] Escape-to-close works with a simple test harness.
* [ ] Supports reduced motion mode flags (even if not yet wired everywhere).
  **Risks / Notes:**
* Expand sequencing must not depend on fragile `setTimeout` chains without cleanup; guard against rapid toggles.
  **Verification Steps:**
* Create a tiny local dev harness (or story/page) to confirm phase transitions: collapsed → prezoom → expanded → closingHold → collapsed.

---

### Task Card 03 — Create slot-based variants factory

**Depends on:** Task Card 01, 02
**Objective:** Standardize variant names and transitions for the shared timeline.
**Scope:**

* Add new file: `src/motion/createExpandableSectionVariants.ts`
  **Plan:**

1. Define standard slot variants: `background`, `scrimTop`, `scrimBottom`, `collapsedHeader`, `glass`, `expandedHeader`, `content`, `ctaRow`.
2. Ensure `background` has distinct `prezoom` behavior (step 0) and can be held stable during container expansion.
3. Encode stagger patterns for header/body/list/cta using shared stagger knobs.
4. Add reduced-motion mappings: disable parallax, disable letter mode, prefer opacity-only for heavy transforms.
   **Acceptance Criteria:**

* [ ] Variants cover both expand and collapse flows.
* [ ] Collapse runs at ~2x speed via `COLLAPSE_TIME_SCALE`.
* [ ] Variants can be adopted by one component without refactoring its entire DOM tree.
  **Risks / Notes:**
* Keep variants flexible: many components have extra overlays (grain, gradients). Those should map to optional slots, not break the factory.
  **Verification Steps:**
* Apply variants to a minimal test component and visually confirm: prezoom occurs before container expansion.

---

### Task Card 04 — Add safe short-text reveal utility (letters only for short strings)

**Depends on:** Task Card 01
**Objective:** Enable optional letter-by-letter reveal for short headers while preventing expensive per-letter body animations.
**Scope:**

* Add new file: `src/motion/textReveal.ts`
  **Plan:**

1. Implement a “shouldAnimateLetters” helper (checks reduced-motion + max char threshold).
2. Provide a split helper for letters/words that preserves accessibility (screen readers should still read full text).
3. Document usage rules: titles/subtitles only; never paragraphs.
   **Acceptance Criteria:**

* [ ] Utility defaults to “off” for long strings and all reduced-motion contexts.
* [ ] No production component uses it yet (pure primitive).
  **Risks / Notes:**
* Avoid creating dozens/hundreds of nodes for body copy—this is explicitly disallowed by your spec.
  **Verification Steps:**
* Run a quick node-count sanity check in dev for a short title vs long paragraph.

---

### Task Card 05 — Pilot migration: `home/marquee-feature` onto shared timeline

**Depends on:** Task Card 01–04
**Objective:** Convert one representative section end-to-end to validate the shared system before rolling out.
**Scope:**

* `src/components/home/marquee-feature.tsx`

  * Background scale: `:99`, `:260`
  * Atmosphere overlays: `:82`, `:277`
  * Collapsed container exit: `:207`, `:454`
  * Header/body/CTA reveals: `:161`, `:171`, `:181`
  * Parallax: `:89`, `:262`
    **Plan:**

1. Replace local hard-coded durations/easings for expand/collapse with shared config + variants factory.
2. Wire expand/collapse behavior through the shared timeline hook (phases include prezoom + closingHold).
3. Ensure collapsed “Read More” is visible immediately in collapsed state (no delayed CTA).
4. Preserve existing scroll-linked parallax behavior, but gate it behind reduced-motion (already implied by audit).
   **Acceptance Criteria:**

* [ ] Prezoom happens before container expansion (visible ordering).
* [ ] Collapse is ~2x speed and has no end “pop”.
* [ ] Parallax is disabled under prefers-reduced-motion.
* [ ] Existing header/body/CTA staggering remains visually similar, but driven by shared knobs.
  **Risks / Notes:**
* Audit notes collapsed view is always mounted when `enableTitleReveal` is true; ensure we don’t regress layoutId behavior while standardizing the slots.
  **Verification Steps:**
* Test expand/collapse rapidly (double click) → no stuck states.
* Test with reduced motion enabled → no parallax, no letter animation, minimal motion.

---

### Task Card 06 — Post-pilot tune: finalize shared timing map + slot compatibility

**Depends on:** Task Card 05
**Objective:** Adjust shared primitives based on the pilot so subsequent conversions are predictable and low-risk.
**Scope:**

* `src/motion/expandableSectionMotion.ts`
* `src/motion/createExpandableSectionVariants.ts`
* `src/motion/useExpandableSectionTimeline.ts`
  **Plan:**

1. Tune base durations/staggers so the pilot matches the target spec feel (especially prezoom length).
2. Confirm `closingHold` correctly waits for exit completion before collapsing the container.
3. Add support for “always mounted collapsed view” vs “AnimatePresence unmount” patterns as a safe option.
   **Acceptance Criteria:**

* [ ] Shared primitives can support both mounting strategies without component-specific hacks.
* [ ] Collapse never snaps the container early.
  **Risks / Notes:**
* This is where we prevent 11 future bespoke exceptions.
  **Verification Steps:**
* Re-test marquee-feature; confirm no behavior regression after tuning.

---

### Task Card 07 — Migrate `shotguns/TriggerExplainer` to shared timeline

**Depends on:** Task Card 06
**Objective:** Convert a second “atmosphere overlays” section to confirm the pattern holds for a different layout.
**Scope:**

* `src/components/shotguns/TriggerExplainer.tsx`

  * Background: `:105`, `:364`
  * Overlays: `:87`, `:381`
  * Header/body reveals: `:156`, `:190`
  * Mobile Collapsible timings referenced: `src/components/ui/collapsible.tsx:21`, `src/styles/site-theme.css:716/727`
    **Plan:**

1. Map existing nodes to standard slots and replace local transitions with shared variants.
2. Ensure collapsed state is the default across breakpoints (remove “desktop-only reveal means expanded render” behavior where it conflicts with the target contract).
3. Preserve the mobile Collapsible behavior, but ensure its contents align with Step 8 “lists/accordions reveal” (stagger items top-to-bottom).
   **Acceptance Criteria:**

* [ ] Expand/collapse follow the shared timeline ordering.
* [ ] Reduced motion disables heavy transforms but keeps interactions usable.
* [ ] Mobile details accordion remains functional and doesn’t pop on close.
  **Risks / Notes:**
* Audit suggests desktop-only gating; we should standardize to “always supports collapsed/expanded,” with reduced-motion adjustments.
  **Verification Steps:**
* Test mobile breakpoint (`lg:hidden` path) and desktop path.
* Test Escape closes when expanded.

---

### Task Card 08 — Migrate `bespoke/BuildStepsScroller` + fix `height: auto` step detail animation

**Depends on:** Task Card 06
**Objective:** Convert section expand/collapse and eliminate `height: auto` animation pitfalls in step detail panels.
**Scope:**

* `src/components/bespoke/BuildStepsScroller.tsx`

  * Background/overlays: `:173`, `:146`, `:506`
  * Header/body/rail staggers: `:229`, `:279`
  * Step detail panel height `0 → auto`: `:883`, `:890`
    **Plan:**

1. Convert outer expand/collapse to shared slot variants + timeline hook.
2. Replace the step detail panel animation that uses `height: auto` with either:

   * layout-based animation, or
   * measured numeric height (match your spec’s “avoid height:auto” rule)
3. Keep existing rail highlight spring behavior intact (audit: `:774`).
   **Acceptance Criteria:**

* [ ] Outer expand/collapse matches shared timeline.
* [ ] Step detail panels no longer animate `height:auto` directly.
* [ ] No layout thrash when rapidly toggling step details.
  **Risks / Notes:**
* This card touches both the section system and a nested accordion behavior; keep the nested fix tightly scoped.
  **Verification Steps:**
* Toggle step detail open/close repeatedly and watch for jumpiness.
* Run reduced motion → detail panels should still open/close without heavy motion.

---

### Task Card 09 — Migrate `experience/ExperiencePicker` and normalize FAQ reveal gating

**Depends on:** Task Card 06
**Objective:** Standardize expand/collapse timeline and remove bespoke “computed delay from card count” timing logic in favor of shared list staggering.
**Scope:**

* `src/components/experience/ExperiencePicker.tsx` (`:258`, `:606` for cards; `:182` for FAQ delay)
* `src/components/experience/FAQList.tsx` (`:53`, `:68`)
  **Plan:**

1. Convert outer section to shared slot variants + timeline hook.
2. Replace FAQ reveal timing that is computed from card count with shared Step 8 list reveal rules:

   * FAQ heading is part of content reveal
   * FAQ items use standardized list stagger
3. Preserve Collapsible behavior per FAQ item (`src/components/ui/collapsible.tsx:21`).
   **Acceptance Criteria:**

* [ ] FAQ reveal no longer depends on “card count math” for delays.
* [ ] FAQ list items reveal top-to-bottom with standard stagger.
* [ ] No per-letter animation applied to FAQ body text.
  **Risks / Notes:**
* This is a behavioral change, but it aligns with the spec’s shared timeline contract and improves predictability.
  **Verification Steps:**
* Verify timing stays consistent when the number of cards changes.
* Toggle FAQ items open/close; ensure no abrupt unmount.

---

### Task Card 10 — Migrate `shotguns/PlatformGrid` and remove 2s delayed “Read more”

**Depends on:** Task Card 06
**Objective:** Bring PlatformGrid onto the shared timeline and align collapsed CTA behavior with the target contract (no delayed “Read more”).
**Scope:**

* `src/components/shotguns/PlatformGrid.tsx`

  * Delayed read more: `:441`, `:810`
  * Tabs/cards staggers: `:133`, `:240`, `:368`
    **Plan:**

1. Convert outer expand/collapse to shared variants + timeline hook.
2. Remove the collapse “Read more waits 2000ms” behavior; collapsed CTA should be present immediately in collapsed state.
3. Preserve internal tab highlight spring + card swap behavior (audit: `:178`, `:371`, `:374`), but ensure it uses shared easing constants where applicable.
   **Acceptance Criteria:**

* [ ] Collapsed “Read more” is visible immediately after collapse finishes (no 2s dead time).
* [ ] Outer expand/collapse follows shared step ordering (prezoom → container → scrims/headers/content → CTA).
* [ ] Tab selection changes still animate as before.
  **Risks / Notes:**
* Removing the 2s delay is a UX change; it’s required to meet the collapsed-state contract.
  **Verification Steps:**
* Collapse the section and confirm the CTA appears promptly.
* Switch tabs in expanded state; ensure swaps still work smoothly.

---

### Task Card 11 — Migrate `shotguns/DisciplineRail` and remove 2s delayed “Read more”

**Depends on:** Task Card 06
**Objective:** Standardize the outer expand/collapse timeline and fix collapsed CTA behavior.
**Scope:**

* `src/components/shotguns/DisciplineRail.tsx`

  * Delayed read more: `:389`, `:791`
  * Nested list no exit: `:866` (not fixed in this card)
    **Plan:**

1. Convert outer section to shared slot variants + timeline hook.
2. Remove delayed “Read more” behavior; collapsed CTA appears immediately.
3. Preserve category accordion and selection change animations for now (do not alter nested list exit yet).
   **Acceptance Criteria:**

* [ ] Outer expand/collapse aligns with shared timeline.
* [ ] Collapsed CTA appears immediately on collapse.
* [ ] Existing category/selection interactions continue to function.
  **Risks / Notes:**
* Nested list exit pop is handled in the next card to keep this one small.
  **Verification Steps:**
* Expand/collapse; then open/close a category; confirm no functional regressions.

---

### Task Card 12 — Add nested discipline list exit animation (DisciplineRail)

**Depends on:** Task Card 11
**Objective:** Eliminate the “no exit animation” pop for nested discipline items to match “reverse timeline” expectations.
**Scope:**

* `src/components/shotguns/DisciplineRail.tsx`

  * Nested list currently unmounts with no exit: `:866`
  * Nested enter stagger: `:542`, `:874`
    **Plan:**

1. Wrap nested discipline list in an exit-capable pattern (e.g., AnimatePresence + exit variants).
2. Use shared list-item exit timing (collapse scale) so close feels snappy.
3. Ensure reduced motion disables translate/blur but still provides a clean fade.
   **Acceptance Criteria:**

* [ ] Closing a category animates nested items out (no abrupt disappearance).
* [ ] Reduced motion path is stable.
  **Risks / Notes:**
* Keep DOM size reasonable; don’t over-animate large lists.
  **Verification Steps:**
* Open a category, then close it; verify nested items exit smoothly.

---

### Task Card 13 — Migrate `shotguns/EngravingGradesCarousel` and remove 2s delayed “Read more”

**Depends on:** Task Card 06
**Objective:** Standardize expand/collapse and align collapsed CTA behavior to the shared contract.
**Scope:**

* `src/components/shotguns/EngravingGradesCarousel.tsx`

  * Delayed read more: `:214`, `:607`
  * Category stagger: `:352`, `:362`
  * Nested list no exit: `:683` (fixed next card)
    **Plan:**

1. Convert outer expand/collapse to shared slot variants + timeline hook.
2. Remove delayed “Read more” behavior on collapse.
3. Preserve grade card swap + internal content stagger (`:749`, `:801`) but shift timing constants to shared config.
   **Acceptance Criteria:**

* [ ] Collapsed CTA appears immediately after collapse.
* [ ] Grade selection still swaps cleanly.
  **Risks / Notes:**
* Nested grade list exit is isolated into a follow-up card.
  **Verification Steps:**
* Expand/collapse; change grade selection; confirm swaps remain smooth.

---

### Task Card 14 — Add nested grade list exit animation (EngravingGradesCarousel)

**Depends on:** Task Card 13
**Objective:** Remove abrupt unmount on accordion close for nested grades.
**Scope:**

* `src/components/shotguns/EngravingGradesCarousel.tsx`

  * Nested list unmount no exit: `:683`
  * Nested enter stagger: `:367`, `:685`
    **Plan:**

1. Add exit variants for nested grade items.
2. Ensure exit runs at collapse speed scale.
3. Confirm category icon rotation remains consistent (Tailwind duration unknown in audit at `:674`).
   **Acceptance Criteria:**

* [ ] Closing category animates nested grades out.
* [ ] No visual pop when collapsing category.
  **Risks / Notes:**
* Be careful not to over-animate large nested lists.
  **Verification Steps:**
* Open/close multiple categories quickly; confirm state doesn’t get stuck.

---

### Task Card 15 — Extend shared scrim variants to support “dual scrim focus/fade” pattern

**Depends on:** Task Card 06
**Objective:** Support both overlay systems (4-layer atmosphere + dual focus/fade) under one standardized scrim contract.
**Scope:**

* `src/motion/createExpandableSectionVariants.ts`
* `src/motion/expandableSectionMotion.ts`
  **Plan:**

1. Add optional scrim mode flag (e.g. `scrimMode: 'atmosphere' | 'dualFocusFade'`).
2. Encode the dual scrim offsets seen in the audit (focus starts ~240ms, fade ~360ms) as configurable offsets.
3. Map both modes into the standard slots `scrimTop`/`scrimBottom` behavior (converge motion) plus optional `atmosphere` overlays.
   **Acceptance Criteria:**

* [ ] Variants can reproduce VisitFactory/BookingOptions/TravelNetwork/ChampionsGallery scrim timing shape.
* [ ] Still supports the existing “atmosphere overlays” components without changes.
  **Risks / Notes:**
* This is the main “abstraction stress test.” Keep it minimal and explicit.
  **Verification Steps:**
* Apply dual scrim mode in a small harness and verify delays visually.

---

### Task Card 16 — Migrate `experience/VisitFactory` to shared timeline (dual scrim mode)

**Depends on:** Task Card 15
**Objective:** Convert a dual-scrim section to validate the shared scrim abstraction.
**Scope:**

* `src/components/experience/VisitFactory.tsx`

  * Scrim focus/fade delays: `:124-125`, `:333`, `:325`
  * Header/detail block reveals: `:204`, `:229`
    **Plan:**

1. Replace local scrim animations with shared `dualFocusFade` scrim mode variants.
2. Convert outer expand/collapse to shared timeline hook.
3. Preserve “What to expect” accordion (Collapsible) behavior.
   **Acceptance Criteria:**

* [ ] Scrims converge + atmosphere feels staged without bespoke per-component delays.
* [ ] Expand/collapse matches shared ordering and collapse is snappy.
  **Risks / Notes:**
* Scrim layers currently have independent delays; ensure the standardized version doesn’t flatten the intended mood.
  **Verification Steps:**
* Expand/collapse and confirm scrim behavior matches the audit’s sequencing feel.

---

### Task Card 17 — Migrate `experience/BookingOptions` + fix scheduler `height:auto`

**Depends on:** Task Card 15
**Objective:** Convert section to shared timeline and eliminate `height:auto` animation for the scheduler panel.
**Scope:**

* `src/components/experience/BookingOptions.tsx`

  * Scheduler wrapper height `0 → auto`: `:587`, `:591`
  * Scrim focus/fade delays: `:112-113`, `:320`, `:313`
    **Plan:**

1. Convert outer section to shared timeline (dual scrim mode).
2. Replace scheduler panel `height:auto` tween with layout animation or measured numeric height.
3. Ensure scheduler open/close remains 550ms-ish (audit) but controlled by shared config.
   **Acceptance Criteria:**

* [ ] Outer expand/collapse uses shared timeline.
* [ ] Scheduler panel no longer animates `height:auto` directly.
* [ ] Reduced motion disables blur/translate but preserves usability.
  **Risks / Notes:**
* Iframe loading can affect measurement; ensure measurement logic handles dynamic height safely.
  **Verification Steps:**
* Toggle scheduler panel rapidly after load; verify no jump or stuck height.

---

### Task Card 18 — Migrate `experience/TravelNetwork` and normalize listReady gating

**Depends on:** Task Card 15
**Objective:** Convert to shared timeline and standardize “list waits for wrapper” behavior using shared Step 8 list reveal.
**Scope:**

* `src/components/experience/TravelNetwork.tsx`

  * List gating timing: `:604`, `:654`
  * Tab swap + highlight: `:576`, `:612`
    **Plan:**

1. Convert outer expand/collapse to shared timeline (dual scrim mode).
2. Replace bespoke “list starts after wrapper finishes + 550ms” gating with shared list-phase timing and shared list stagger.
3. Keep tab change micro animations and spring highlight, but drive constants from shared config.
   **Acceptance Criteria:**

* [ ] List items reveal top-to-bottom with standardized stagger in both initial expand and tab switches.
* [ ] Reduced motion disables spring highlight and heavy transforms but keeps tab content swap understandable.
  **Risks / Notes:**
* Re-animating long lists on every tab switch can be expensive; keep item count in mind.
  **Verification Steps:**
* Expand → switch tabs → confirm list re-animates without jank.

---

### Task Card 19 — Migrate `heritage/ChampionsGallery` to shared timeline

**Depends on:** Task Card 15
**Objective:** Standardize expand/collapse and align filter/list reveal patterns to the shared list step.
**Scope:**

* `src/components/heritage/ChampionsGallery.tsx`

  * Filter/list staggers: `:266`, `:302`
  * Detail panel swap: `:704`, `:709`
    **Plan:**

1. Convert outer section to shared timeline (dual scrim mode).
2. Map filters and champion list to shared Step 8 list reveal (consistent staggers).
3. Ensure detail panel swap uses shared micro timing/ease (audit suggests `easeOut` 220ms).
   **Acceptance Criteria:**

* [ ] Expand/collapse follows shared timeline ordering.
* [ ] Filter/list reveals are consistent and not over-animated.
* [ ] Reduced motion disables spring highlight and heavy transforms.
  **Risks / Notes:**
* This section has multiple animated sub-systems (filters + list + detail). Keep outer timeline changes isolated.
  **Verification Steps:**
* Expand/collapse, change filter, change selection; confirm no regressions.

---

### Task Card 20 — Migrate `home/timeline-scroller` outer expand/collapse to shared timeline (preserve internal stage interactions)

**Depends on:** Task Card 06
**Objective:** Standardize the outer section timeline while keeping the complex pinned/stage behaviors intact.
**Scope:**

* `src/components/home/timeline-scroller.tsx`

  * Outer bg/overlays: `:145`, `:126`
  * Header/body reveal: `:249`, `:259`
  * Stage accordion uses max-height: `:648`
  * Pinned panel transitions: `:795`, `:842`
    **Plan:**

1. Convert outer expand/collapse to shared slot variants + timeline hook.
2. Preserve pinned panel stage-change animations and highlight spring (do not re-architect internal panel logic).
3. Ensure collapse uses `closingHold` so internal body exits complete before container collapse.
   **Acceptance Criteria:**

* [ ] Outer expand/collapse matches shared timeline and has no end pop.
* [ ] Pinned stage interactions still work exactly as before.
* [ ] Reduced motion behavior remains stable (no accidental re-enabling of heavy animations).
  **Risks / Notes:**
* This is the highest-risk conversion due to extra internal motion systems; do it last.
  **Verification Steps:**
* Expand/collapse, switch stages in pinned mode, open/close stage accordion in stacked mode.

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
