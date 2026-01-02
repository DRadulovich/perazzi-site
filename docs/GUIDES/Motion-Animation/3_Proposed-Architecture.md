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