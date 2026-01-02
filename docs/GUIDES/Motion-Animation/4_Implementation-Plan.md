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