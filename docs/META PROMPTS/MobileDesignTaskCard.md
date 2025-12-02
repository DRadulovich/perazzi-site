## CODEX TASK CARD — Mobile Spec Audit & Auto-Refactor

**Goal**

Use `docs/Mobile-Design-Guide.md` as the canonical mobile spec to:

1. Audit **one specific file** for mobile behavior.
2. Systematically walk through the Mobile Design Guide **section by section**.
3. For each section:

   * Decide whether the current implementation **passes** or **fails** that section.
   * If it fails, **modify the code in the target file** to bring it into spec.
4. At the end, output a **Mobile Audit Report** summarizing pass/fail per section and the changes made.
5. Finally, state whether **any further work is required** to fully meet the spec.

---

### 0. Inputs (you fill these in before running)

* **Target file path:** `XXXXXXXXXXXX`
* **Component name (for reporting):** `XXXXXXXXXXXX`
* **Mobile spec file:** `docs/Mobile-Design-Guide.md`

> You must treat `Mobile-Design-Guide.md` as the **single source of truth** for mobile behavior.

---

### 1. Preparation

1. Open and read:

   * `docs/Mobile-Design-Guide.md`
   * `src/.../COMPONENT_FILE.tsx` (the target component file)

2. From the guide, build an internal checklist with these sections:

   1. Core Principles
   2. Breakpoints & Typography
   3. Spacing, Layout & Containers
   4. Full-Bleed Sections & Safe Areas
   5. Imagery & Media
   6. Interaction, Tap Targets & Microcopy
   7. Accessibility & Legibility
   8. Motion & Performance
   9. Content Density & Truncation
   10. Component Pattern Specs (Hero / Card Grids / Timelines / etc.)
   11. Analytics & Instrumentation (if the component is multi-stage / narrative)

3. Quickly classify what this component *is* on mobile (hero, card grid, timeline/stepper, simple section, etc.) so you know which pattern(s) in §10 apply.

---

### 2. Audit Process (section-by-section)

For **each** section of the checklist above:

1. **Check applicability**

   * If the section clearly **does not apply** (e.g. no imagery, no multi-stage behavior, not a hero, etc.), mark that section as:

     * `PASSED (Not applicable to this component)`
   * Otherwise, continue.

2. **Compare code vs spec**

   * Inspect the target file for any violations of the rules described for that section in `Mobile-Design-Guide.md`.
   * Examples:

     * Typography: headings too large at base, missing responsive scales, microcopy using wrong sizes.
     * Spacing: `py-16` at base, no mobile-first padding.
     * Card shells: inner/nested cards using borders/shadows/blur at mobile.
     * Full-bleed: missing `max-w-[100vw]`, missing `overflow-x-hidden`.
     * Imagery: single aspect ratio across all breakpoints.
     * Interaction: hover-only behavior, tiny tap targets.
     * Accessibility: low contrast text over images, no focus styles.
     * Motion: heavy blur/shadow/animations at base.
     * Content density: very long paragraphs, no line-clamp where needed.
     * Pattern specs: hero, card grid, or timeline not following the archetype.
     * Analytics: multi-stage component not tracking visibility.

3. **Decide PASS vs FAIL**

   * If the code **already follows** the rules for that section, do not change the code. Mark that section as:

     * `PASSED`
   * If the code **violates** the rules, mark that section as:

     * `FAILED`
   * Then **modify the target file** to bring it into spec, following the concrete transformation patterns in the guide.

4. **When modifying code:**

   * **Only edit the target file** unless a tiny shared utility is absolutely required.
   * Preserve the existing **brand and visual language** (colors, typography choices, general layout).
   * Prefer **minimal, surgical changes** that satisfy the spec.
   * Use the guide’s specific patterns whenever they’re given:

     * e.g. `text-2xl sm:text-3xl lg:text-4xl` for large headings.
     * `py-10 sm:py-16 lg:py-20` for sections that previously used `py-16`.
     * Outer card: rounded-2xl / subtle blur / `bg-card/10`.
     * Inner/nested cards: `border-none bg-card/0 shadow-none` on mobile.
     * Aspect ratios: `aspect-[3/2] sm:aspect-[4/3]`.
     * Scroll-snap patterns for timelines if applicable.
   * For motion and performance, **downgrade** heavy effects on mobile, not on desktop.

---

### 3. Specific Expectations per Section

Use these as anchors when you decide PASS vs FAIL and when you make changes:

1. **Core Principles**

   * Base styles tuned for ~375–430px width.
   * Larger breakpoints *enhance* layout, not define it.
   * If layout is clearly “desktop first squeezed onto mobile”, treat as `FAILED`.

2. **Breakpoints & Typography**

   * Body: default `text-sm` at base, `text-xs` only for labels/microcopy.
   * Headings: no `text-3xl`+ at base; use responsive scale as per guide.
   * Microcopy: keep small but legible.

3. **Spacing, Layout & Containers**

   * Section padding: `py-8`–`py-10` at base; ramp up at `sm` and `lg`.
   * Card shells:

     * Outer card can have subtle blur/shadow at mobile.
     * **Inner / nested cards on mobile:**

       * `border-none bg-card/0 shadow-none`.
       * Treat them as flat content inside the outer shell.

4. **Full-Bleed & Safe Areas**

   * Any full-bleed section using the `calc(50% - 50vw)` hack must have:

     * `max-w-[100vw]`
     * `overflow-x-hidden` (on that section or wrapper).
   * Fixed headers/footers touching edges must handle `safe-area-inset-*`.

5. **Imagery & Media**

   * Mobile aspect ratio: `aspect-[3/2]` (or similar), with `sm:aspect-[4/3]` or more cinematic for larger screens.
   * Scrims over images when text overlays them; ensure legibility.
   * Reasonable `sizes` attributes and `priority` usage.

6. **Interaction, Tap Targets & Microcopy**

   * No hover-only critical behavior on mobile.
   * Buttons and touch targets must be comfortable to tap.
   * Microcopy should match the actual interaction (“Scroll to explore”, “Swipe to browse” only for carousels, etc.).

7. **Accessibility & Legibility**

   * Minimum text sizes and contrast.
   * Text over imagery must have scrims/overlays.
   * Clear focus styles for interactive elements.

8. **Motion & Performance**

   * Subtle transitions on mobile.
   * Avoid heavy scroll-tied parallax, layered blur and deep shadow combos in small viewports.
   * Honor `prefers-reduced-motion` where relevant.

9. **Content Density & Truncation**

   * Avoid walls of text.
   * Use `line-clamp` and spacing for dense card views.
   * Split long paragraphs into smaller, scannable pieces.

10. **Component Pattern Specs**

* If it behaves like a hero, card grid, or timeline, **align it** with the corresponding pattern in §10 of the guide.
* If none of the patterns apply, you can mark this as `PASSED (Not pattern-based)` after verifying there’s nothing contradictory.

11. **Analytics & Instrumentation**

* Only required if the component is multi-stage / narrative / scrollytelling.
* If it is: ensure there is some mechanism to track per-stage visibility (e.g. via active stage changes or intersection observers).
* If not multi-stage, mark as `PASSED (Not applicable)`.

---

### 4. Output: Mobile Audit Report

After all code changes are applied, output a **Markdown report** in the following format in the chat (do not write this report into the source file):

```md
## Mobile Audit Report — ComponentName

**Target file:** `src/.../COMPONENT_FILE.tsx`

1. Core Principles — PASSED/FAILED  
   - If FAILED, summarize:
     - Key violations you found.
     - Concrete changes you made to fix them.

2. Breakpoints & Typography — PASSED/FAILED  
   - Changes (if any): ...

3. Spacing, Layout & Containers — PASSED/FAILED  
   - Changes (if any): ...

4. Full-Bleed Sections & Safe Areas — PASSED/FAILED  
   - Changes (if any): ...

5. Imagery & Media — PASSED/FAILED  
   - Changes (if any): ...

6. Interaction, Tap Targets & Microcopy — PASSED/FAILED  
   - Changes (if any): ...

7. Accessibility & Legibility — PASSED/FAILED  
   - Changes (if any): ...

8. Motion & Performance — PASSED/FAILED  
   - Changes (if any): ...

9. Content Density & Truncation — PASSED/FAILED  
   - Changes (if any): ...

10. Component Pattern Specs — PASSED/FAILED/NOT APPLICABLE  
    - Pattern identified (if any): Hero / Card grid / Timeline / Other
    - Changes (if any): ...

11. Analytics & Instrumentation — PASSED/FAILED/NOT APPLICABLE  
    - Changes (if any): ...

---

### Overall Status

- Overall mobile spec status: FULLY IN SPEC / PARTIALLY IN SPEC
- **Additional changes required to be fully in spec?** YES/NO

If YES:
- List the remaining issues and why you did not fix them (e.g. out of scope, requires cross-component change, uncertainty about intended design).
```

---

### 5. Constraints & Style

* Do **not** invent new design systems; strictly follow `Mobile-Design-Guide.md`.
* Keep the visual and brand language intact; focus on mobile behavior and spec compliance.
* Prefer small, focused patches over large rewrites.
* Only modify other files if absolutely necessary, and call that out explicitly in the report.

---