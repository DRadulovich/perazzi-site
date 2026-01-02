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