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