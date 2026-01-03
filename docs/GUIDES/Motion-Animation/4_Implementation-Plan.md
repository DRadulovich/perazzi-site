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

## Shared note for Task Cards 01–20 (Codex execution pattern)

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

# Practical workflow to run this with Codex in VS Code

1. **Run Task Card 00 first** (AGENTS.md). Codex is explicitly designed to load it as persistent guidance. ([OpenAI Developers][4])
2. For each card:

   * Open the files in VS Code, and/or tag them with `@path` in the prompt. ([OpenAI Developers][2])
   * Paste *one* task card per Codex thread (avoid two threads editing same files). ([OpenAI Developers][1])
   * Require Codex to run the repo’s verification scripts (from `package.json`). Codex performs better when it can verify its work. ([OpenAI Developers][1])

---






---






Your Codex audit is pointing at the *right* dragons, and the symptoms you’re describing (“everything feels like it starts at once”, “collapsed stays tall”, “reduced‑motion loses the interaction model”) match those gaps almost perfectly.

## What I think about the Codex audit (agree + add one extra root cause)

### ✅ Agree with the audit’s main gaps

1. **Collapse isn’t faster than expand**

* You currently have `COLLAPSE_TIME_SCALE` set equal to expand. That violates the contract and will make close feel “floaty” instead of snappy. (Codex cited `src/motion/expandableSectionMotion.ts:4–5`.)

2. **Hover expands (not just teases)**

* Multiple components still call expand on `onPointerEnter`. That directly contradicts “hover may highlight/tease but must not expand unless explicitly enabled.” (Codex gave a long list of `onPointerEnter` callsites.)

3. **Reduced motion breaks the interaction model**

* Because `enableTitleReveal` is gated off under reduced motion and many sections do `defaultExpanded: !enableTitleReveal`, reduced‑motion users effectively get “always expanded” (and often lose expand/collapse affordances). That’s the opposite of “same interaction model, reduced motion just simplifies motion.” (Codex cited the `defaultExpanded: !enableTitleReveal` pattern across all sections.)

4. **Container expansion/collapse isn’t happening correctly**

* If `minHeight` is pinned to a measured `expandedHeight`, the section can’t visually collapse back to ~60vh. That’s why your collapses feel like “fade outs” rather than “collapse sequences.” (Codex cited several `minHeight` / `expandedHeight` lines.)

5. **Hook doesn’t implement scroll anchoring/outside click**

* Not fatal, but it’s one of the “polish requirements” and affects perceived smoothness when expansion changes layout. (Codex cited `src/motion/useExpandableSectionTimeline.ts:29`.)

### 🧠 One extra culprit that explains your “everything happens at once” feeling

Even with `EXPAND_TIME_SCALE = 4`, your **stagger timing currently does *not* scale** with that value.

In your `createExpandableSectionVariants.ts`, you scale durations via:

* `duration: (ms/1000) * EXPAND_TIME_SCALE`

…but your `staggerChildren` is currently:

* `staggerChildren: (staggerMs/1000)` *(no multiply)*

So when you slow things down 4×:

* each item’s animation becomes **2.2s** long (550ms × 4),
* but the stagger stays **0.10–0.12s**.

That makes lots of items begin nearly together, just with long overlapping tweens — which reads as “simultaneous.”

That’s why you’re not seeing the timeline “separate into steps” when you slow it down.

## Why you shouldn’t expect “one step at a time” right now

With your current shared variants, almost every slot (`scrimTop`, `scrimBottom`, `collapsedHeader`, `glass`, `expandedHeader`, `content`, `ctaRow`) switches behavior on the same phase transition (`prezoom → expanded`). If there are no *slot-level delays* and staggers aren’t scaled, most things will look like they start together.

The target spec allows *overlap*, but it does **not** allow:

* hover-triggered expansion,
* collapse same speed as expand,
* reduced-motion = no interaction model,
* container never actually collapsing.

Those are the big blockers.

---

# Plan to reach your desired end state

This is the sane order (minimizes thrash + lets you “feel” progress after each step):

1. **Fix the global timing semantics**

* Collapse scale and stagger scaling.
* This alone should immediately make the system feel more readable at `EXPAND_TIME_SCALE = 4`.

2. **Fix the interaction contract**

* Remove hover-to-expand everywhere (replace with tease-only or nothing).
* Restore reduced-motion interactivity (reduced motion changes *how* it animates, not *whether* it works).

3. **Fix the container height model**

* Reintroduce a real collapsed height (~60vh).
* Make expansion/collapse happen via `layout` (preferred) or controlled numeric height.
* Stop pinning `minHeight` to the expanded measurement in the collapsed state.

4. **Only then: tune sequencing offsets**

* If you still want stronger “step separation,” add small standardized slot delays (glass/header/content/cta) in the shared variants.
* Doing that before container collapse works is… like tuning a violin while it’s on fire.

5. **Polish**

* Optional scroll anchoring and outside click close.

---

# Optional: a Codex research mission (so I can be extremely precise)

Since I can’t reliably browse your GitHub tree from here (GitHub keeps throwing a signed-out session error in this environment), the fastest way to eliminate any remaining UNKNOWNs is to have Codex extract the exact current patterns.

### Task Card R1 — Motion System Gap Report (No code changes)

**Objective:** Produce a precise, per-component report of how expand/collapse is currently wired (triggers, container sizing, reduced motion behavior, variant propagation).
**Scope:**

* `src/motion/expandableSectionMotion.ts`
* `src/motion/createExpandableSectionVariants.ts`
* `src/motion/useExpandableSectionTimeline.ts`
* These components (12):

  * `src/components/home/timeline-scroller.tsx`
  * `src/components/home/marquee-feature.tsx`
  * `src/components/shotguns/PlatformGrid.tsx`
  * `src/components/shotguns/DisciplineRail.tsx`
  * `src/components/shotguns/TriggerExplainer.tsx`
  * `src/components/shotguns/EngravingGradesCarousel.tsx`
  * `src/components/bespoke/BuildStepsScroller.tsx`
  * `src/components/experience/ExperiencePicker.tsx`
  * `src/components/experience/VisitFactory.tsx`
  * `src/components/experience/BookingOptions.tsx`
  * `src/components/experience/TravelNetwork.tsx`
  * `src/components/heritage/ChampionsGallery.tsx`
    **Plan:**

1. For each component, list:

   * Expand triggers (click target(s), any `onPointerEnter`, key handlers)
   * How `useExpandableSectionTimeline` is invoked (options object)
   * How container height is controlled (style/class, `minHeight`, measured height usage)
   * Whether the section container has `layout` enabled (and its transition)
   * Whether children rely on variant propagation *or* set `animate={phase}` individually (this affects `staggerChildren`)
2. Output a markdown table + file:line references + 1–3 relevant code snippets per component.
3. Do **not** modify code.
   **Acceptance Criteria:**

* [ ] Report covers all 12 components + 3 shared motion files.
* [ ] Every claim includes file:line.
* [ ] Explicitly flags any “stagger broken because children set animate directly.”
  **Risks / Notes:**
* This is purely diagnostic; it makes the next fixes faster and safer.
  **Verification Steps:**
* N/A (report only)

If you paste that report here, I can give you an even tighter, near-zero-guesswork fix sequence.

---

# Implementation plan as new Codex task cards

These are the “get to desired end state” cards. I’m numbering them after your existing 20.

## Shared primitives first

### Task Card 21 — Restore snappy collapse speed globally

**Objective:** Make collapse feel ~2× faster than expand by default, per the spec contract.
**Scope:**

* `src/motion/expandableSectionMotion.ts` (Codex cited lines ~4–5)
  **Plan:**

1. Change `COLLAPSE_TIME_SCALE` default to `EXPAND_TIME_SCALE * 0.5`.
2. Ensure any derived timings (like closing hold calculations in the hook) still compile and behave correctly.
3. Keep `EXPAND_TIME_SCALE` user-tunable for debugging.
   **Acceptance Criteria:**

* [ ] Collapsing is visibly faster than expanding across sections.
* [ ] No TypeScript errors.
  **Risks / Notes:**
* If any components were implicitly “timed” assuming equal scales, they’ll feel different (this is intended).
  **Verification Steps:**
* Run dev server; expand then collapse any section; confirm close is ~2× faster.

---

### Task Card 22 — Make all staggers honor the time scales

**Objective:** When you set `EXPAND_TIME_SCALE = 4`, staggers should also slow down 4× (per spec: scale applies to all expand durations/delays).
**Scope:**

* `src/motion/createExpandableSectionVariants.ts`
  **Plan:**

1. Update the stagger helper so `staggerChildren` is multiplied by the correct scale:

   * Expand staggers × `EXPAND_TIME_SCALE`
   * Collapse staggers × `COLLAPSE_TIME_SCALE`
2. Ensure both “enter” and “exit” staggers are scaled (including `staggerDirection: -1` cases).
3. Keep reduced-motion behavior: stagger disabled when reduced motion is active.
   **Acceptance Criteria:**

* [ ] With `EXPAND_TIME_SCALE = 4`, header/body/list items clearly start farther apart.
* [ ] With `EXPAND_TIME_SCALE = 1`, behavior matches expected baseline.
  **Risks / Notes:**
* This will make debug mode dramatically clearer (which is exactly what you want right now).
  **Verification Steps:**
* Set `EXPAND_TIME_SCALE = 4` temporarily and visually confirm stagger separation.

---

### Task Card 23 — Fix reduced-motion interaction model globally

**Objective:** Reduced-motion users must still be able to expand/collapse; only the *motion style* should simplify.
**Scope:**

* All 12 components where Codex observed `defaultExpanded: !enableTitleReveal`:

  * (Examples cited) `src/components/home/marquee-feature.tsx:32, :77`, plus the rest in the Codex audit list.
    **Plan:**

1. In each component:

   * Stop using `defaultExpanded: !enableTitleReveal`.
   * Default should be collapsed unless you have an explicit product decision otherwise.
2. Ensure reduced motion changes the **variants mode** (e.g., `motionMode: "reduced"`) rather than skipping the entire interaction model.
3. Ensure “Read More” + “Close” controls remain rendered/usable in reduced motion.
   **Acceptance Criteria:**

* [ ] With `prefers-reduced-motion: reduce`, every section can still expand/collapse via click and Escape.
* [ ] Reduced motion disables heavy effects (parallax/blur/letter reveal), but keeps basic fades/layout.
  **Risks / Notes:**
* Some components may have previously “forced expanded” on mobile/reduced motion for layout reasons; this is where you decide whether that was a requirement or a workaround.
  **Verification Steps:**
* Enable reduced motion at OS level and test at least 3 sections (home + shotguns + experience).

> If you want to keep tasks smaller: do this as 6 cards, 2 components per card (same mechanical change), instead of one giant sweep.

---

### Task Card 24 — Remove hover-to-expand everywhere (hover can tease only)

**Objective:** Hover must not trigger expansion unless explicitly enabled (and right now, it isn’t).
**Scope:**
Remove/replace the `onPointerEnter` expand calls cited by Codex, including:

* `src/components/home/timeline-scroller.tsx:438`
* `src/components/home/marquee-feature.tsx:447`
* `src/components/experience/BookingOptions.tsx:421`
* `src/components/heritage/ChampionsGallery.tsx:435`
* …and the rest of the audit list
  **Plan:**

1. Delete `onPointerEnter` handlers that call `open()` / set expanded.
2. If you want hover tease, implement it as:

   * CSS hover states (preferred), or
   * local `isHovered` state that only changes scrim/brightness/scale slightly, **never** toggling expand.
3. Confirm click/tap is still the only expand trigger.
   **Acceptance Criteria:**

* [ ] Hover never expands.
* [ ] Click/tap still expands.
* [ ] No regressions to keyboard open/escape close.
  **Risks / Notes:**
* If hover-open was masking container height bugs, removing it will make those bugs more visible (good).
  **Verification Steps:**
* Desktop: hover each section; confirm no expand.
* Click “Read More”; confirm expand.

---

## Container expansion (the big visual missing piece)

### Task Card 25 — Reintroduce real container collapse/expand using layout

**Objective:** Make the section container actually move between collapsed (~60vh) and expanded (content height) with Framer Motion layout animation.
**Scope:**

* Start with one pilot component (recommend `src/components/home/marquee-feature.tsx` since it’s already a visual reference point). Codex cited container sizing lines like `:178`, `:216`, `:284`.
  **Plan:**

1. Ensure the section container is a `motion.*` element with `layout` enabled.
2. In `collapsed` and `prezoom` phases:

   * enforce a visible height of ~`60vh` (via `height` or `maxHeight`, not `minHeight`)
   * set `overflow: hidden`
3. In `expanded` and `closingHold` phases:

   * remove the fixed height constraint (let content define height)
   * allow overflow per design (often visible or auto)
4. Remove the pattern where `minHeight` is locked to measured `expandedHeight` in collapsed state.
5. Ensure layout transition duration uses:

   * expand duration scaled by `EXPAND_TIME_SCALE`
   * collapse duration scaled by `COLLAPSE_TIME_SCALE`
     **Acceptance Criteria:**

* [ ] Collapsed state is visibly ~60vh.
* [ ] Expand animates container height (not just fades).
* [ ] Collapse animates back down after exits (no “stuck tall”).
  **Risks / Notes:**
* Some sections may have internal scroll containers; if layout feels janky, fallback is measured numeric height, but try layout first.
  **Verification Steps:**
* Expand → collapse repeatedly; confirm no stuck heights and no big scroll jumps.

---

### Task Card 26 — Roll out container layout fix to the remaining sections (small batches)

**Objective:** Apply the proven container-height approach everywhere.
**Scope:**
Do in 6 cards of 2 components each (≤2 files touched per card), for example:

* Card 26a: `PlatformGrid.tsx` + `TriggerExplainer.tsx`
* Card 26b: `DisciplineRail.tsx` + `EngravingGradesCarousel.tsx`
* Card 26c: `BuildStepsScroller.tsx` + `ChampionsGallery.tsx`
* Card 26d: `ExperiencePicker.tsx` + `VisitFactory.tsx`
* Card 26e: `BookingOptions.tsx` + `TravelNetwork.tsx`
* Card 26f: `timeline-scroller.tsx` (alone; it’s the “don’t touch with muddy boots” file)
  **Plan:**

1. Apply the same collapsed height + layout rules.
2. Remove expandedHeight-minHeight locking if present.
3. Verify close actually collapses visually.
   **Acceptance Criteria:**

* [ ] Each converted section collapses to ~60vh.
* [ ] Expand/collapse feels consistent across the site.
  **Risks / Notes:**
* `timeline-scroller` likely has the most custom internal layout behavior; do it last and keep it surgical.
  **Verification Steps:**
* Manual expand/collapse check after each batch.

---

## (Only if needed) Stronger step sequencing / offsets

After Task Cards 21–26, you’ll already be much closer to the target.

If you *still* want more “chaptered” sequencing (scrims → glass → header → content → CTA), then:

### Task Card 27 — Add standardized slot delays for clearer step sequencing

**Objective:** Make the shared timeline read as steps (without making total duration explode).
**Scope:**

* `src/motion/expandableSectionMotion.ts`
* `src/motion/createExpandableSectionVariants.ts`
  **Plan:**

1. Add a small set of **base slot delays** (ms) for expand and collapse groups (glass/header/content/cta).
2. Apply those delays inside the variants transitions (and scale them by EXPAND/COLLAPSE scale).
3. Ensure `closingHold` duration in the hook remains long enough to cover the delayed exits.
   **Acceptance Criteria:**

* [ ] At `EXPAND_TIME_SCALE=4`, you can clearly see step separation.
* [ ] At `EXPAND_TIME_SCALE=1`, it still feels snappy (not 5–6 seconds long).
  **Risks / Notes:**
* Do this only once container height and stagger scaling are correct, or you’ll be tuning illusions.
  **Verification Steps:**
* Visual test at scale 4 then scale 1.

---

## Optional polish (not blockers, but nice)

### Task Card 28 — Add optional scroll anchoring + outside click close to the shared hook

**Objective:** Prevent scroll-jump on expand and optionally collapse when clicking outside.
**Scope:**

* `src/motion/useExpandableSectionTimeline.ts` (Codex cited missing options)
* A pilot component to wire the ref (1 file)
  **Plan:**

1. Update the hook to optionally manage:

   * `containerRef`
   * on expand: if top of section is above viewport, scroll it into view smoothly (guarded)
   * outside click to close (optional, safe default off)
2. Wire into one pilot component first.
3. Roll out later if the pattern works.
   **Acceptance Criteria:**

* [ ] No scroll jump surprises on expand.
* [ ] Outside click close works only when enabled.
  **Risks / Notes:**
* Outside-click close can be annoying if the section has lots of interactive children; keep default off.
  **Verification Steps:**
* Expand mid-page; confirm it doesn’t shove content weirdly.

---

# After you fix these, can you “change how it animates” or add steps later?

Yes — *and this is the whole point of centralizing it*.

Once:

* container layout is correct,
* collapse scale is correct,
* staggers scale correctly,
* interaction model works under reduced motion,

…then changes like:

* “make glass pop later”
* “make CTA reveal last”
* “increase header stagger”
* “add a new step between meta and content”
  become **one-file** (or two-file) edits in:
* `src/motion/expandableSectionMotion.ts` (knobs, delays, scales)
* `src/motion/createExpandableSectionVariants.ts` (what each slot does, and when)

And if you want to change sequencing timing, you’ll add/adjust:

* slot delays (recommended), or
* an additional phase (more invasive), if you truly need hard barriers.

---

If you run **Task Card 21 + 22 + 25 (pilot on marquee-feature)**, you should immediately stop seeing “everything at once” when `EXPAND_TIME_SCALE = 4`, because:

* collapses will actually be faster,
* staggers will actually slow down,
* the container will actually animate height again.

Then the rest becomes a fairly mechanical rollout.
