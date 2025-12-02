# Mobile Design Guideline

_A canonical spec for how components should behave and be refactored for small screens._

This document defines:

- What “in spec for mobile” means for this project.
- How to **detect** when a component is out of spec.
- How to **mechanically transform** code to bring it into spec (with consistent patterns).

Assumptions:

- Tech: React + Next.js + Tailwind CSS.
- Breakpoints (Tailwind defaults):  
  - `base` (no prefix) = mobile-first  
  - `sm` ≥ 640px  
  - `md` ≥ 768px  
  - `lg` ≥ 1024px  
  - `xl` ≥ 1280px  

When AI is asked to “audit a component through the lens of the Mobile Design Guideline,” it should:

1. Compare the component’s current code to these rules.
2. Identify violations.
3. Apply the transformation patterns below to fix them, **keeping behavior consistent across the site**.

---

## 1. Core Principles

1. **Mobile-first, not desktop-squished.**  
   Base styles (`className` without breakpoints) must be tuned for a ~375–430px phone. Larger breakpoints *enhance* the layout; they don’t define it.

2. **Consistency over cleverness.**  
   If two components solve the same problem (e.g. hero, card grid, timeline), they should feel the same on mobile: same typographic scales, paddings, radii, and interaction patterns.

3. **Accessibility and legibility first.**  
   No amount of animation or glassmorphism is allowed to make text hard to read or actions hard to tap.

4. **Performance-aware.**  
   Blur, shadows, and heavy animations are tuned down on mobile to protect low-end devices.

---

## 2. Breakpoints & Typography

### 2.1 Base font sizes

- **Body text (default content):**  
  - Base: `text-sm` (`14px`) preferred; `text-xs` (`12px`) only for micro-labels.  
- **Microcopy / labels (e.g. “Stage 1”, “Eyebrow”):**  
  - Base: `text-[11px]` or `text-xs`. Use sparingly and with strong letter spacing.

### 2.2 Heading scales (example pattern)

**Out-of-spec pattern:**

- Headings set as `text-4xl` at base with huge tracking, making them dominate mobile screens.

**In-spec transformation pattern:**

For primary section headings:

```tsx
// BEFORE (violates spec)
<p className="text-4xl font-black uppercase tracking-[0.35em]">
  Craftsmanship Journey
</p>

// AFTER (in spec)
<p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.25em] sm:tracking-[0.35em]">
  Craftsmanship Journey
</p>

For subtitles:

// BEFORE
<h2 className="text-xl font-light italic">
  Three rituals that define...
</h2>

// AFTER
<h2 className="text-base sm:text-lg lg:text-xl font-light italic">
  Three rituals that define...
</h2>

For supporting body copy inside rich sections:

// BEFORE
<p className="text-sm">
  ...
</p>

// AFTER
<p className="text-xs sm:text-sm">
  ...
</p>
```

**Rule:**

- Any heading that uses `text-3xl` or larger at the base breakpoint must be converted to a responsive scale (e.g. `text-2xl sm:text-3xl lg:text-4xl`) so it is smaller on mobile and grows at larger sizes.

---

## 3. Spacing, Layout & Containers

### 3.1 Section padding

**Out-of-spec pattern:**

```tsx
<section className="py-16 sm:py-20">
  ...
</section>
```

- Too tall on mobile; feels like excessive white space.

**In-spec transformation:**

```tsx
<section className="py-10 sm:py-16 lg:py-20">
  ...
</section>
```

**Rule:**

- For vertical section padding:
  - Base (mobile): use `py-8`–`py-10`.
  - `sm`: upgrade to `py-12`–`py-16`.
  - `lg+`: allow `py-16`–`py-20` for marquee sections.

### 3.2 Card shells (glass containers)

**Out-of-spec pattern:**

```tsx
<div className="rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm">
  ...
</div>
```

- Heavy blur, big radii, and strong shadow on **every** card, including nested/inner cards, on small screens.

**In-spec transformation (outermost foreground card):**

```tsx
<div
  className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm backdrop-blur-sm
             sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg"
>
  ...
</div>
```

**In-spec transformation (inner / nested cards):**

```tsx
<div
  className="space-y-4 border-none bg-card/0 p-4 shadow-none
             sm:border-none sm:bg-card/0 sm:p-4 sm:shadow-none"
>
  ...
</div>
```

**Rule:**

- Base (mobile):
  - Radii: `rounded-xl` or `rounded-2xl` are allowed but should not be relied on to communicate hierarchy.
  - Shadow: `shadow-none`.
  - Background: `bg-card/0` (fully transparent) so inner/nested cards visually read as content within the outer card rather than separate surfaces.
  - **Blur:** allowed only on the outermost foreground card in a stack or section (e.g. a main hero/pinned card), and kept subtle (e.g. `backdrop-blur-sm` with `bg-card/10`).
  - **Borders:** inner/nested cards must use `border-none` at the base breakpoint to avoid any visible double lines inside a blurred outer container.
- Larger breakpoints:
  - Inner/nested cards should **remain visually flat** (`border-none`, `bg-card/0`, `shadow-none`), relying on spacing and typography for structure rather than additional card chrome.
- Scope:
  - These inner/nested card rules apply when the cards are visually contained within a distinct outer foreground card (e.g. a blurred hero shell or pinned layout). Standalone cards that sit directly on the page background (such as card grids in §10.2) should follow their own card-surface pattern (border/bg/shadow) appropriate to that archetype.

---

## 4. Full-Bleed Sections & Safe Areas

### 4.1 Full-bleed hack

Common pattern:

```tsx
<section
  className="relative isolate w-screen overflow-hidden py-16"
  style={{
    marginLeft: "calc(50% - 50vw)",
    marginRight: "calc(50% - 50vw)",
  }}
>
  ...
</section>
```

**Spec-compliant transformation:**

```tsx
<section
  className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16"
  style={{
    marginLeft: "calc(50% - 50vw)",
    marginRight: "calc(50% - 50vw)",
  }}
>
  ...
</section>
```

**Rule:**

- Any full-bleed section using the `calc(50% - 50vw)` trick must also include:
  - `max-w-[100vw]`
  - `overflow-x-hidden` (either on the section or on a wrapping element)

### 4.2 Safe areas (notches, home indicators)

For any fixed or sticky elements at top or bottom, add safe-area padding:

```tsx
<header
  className="fixed inset-x-0 top-0 z-50 bg-[color:var(--color-canvas)]/90 backdrop-blur-sm"
  style={{ paddingTop: "env(safe-area-inset-top)" }}
>
  ...
</header>

<footer
  className="fixed inset-x-0 bottom-0 bg-[color:var(--color-canvas)]/90"
  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
>
  ...
</footer>
```

**Rule:**

- Fixed or sticky bars that touch the top/bottom edge must account for `safe-area-inset-*`.

---

## 5. Imagery & Media

### 5.1 Aspect ratios

**Out-of-spec pattern:**

```tsx
<div className="relative aspect-[4/3] w-full ...">
  ...
</div>
```

Used identically on all breakpoints.

**In-spec transformation:**

```tsx
<div className="relative aspect-[3/2] sm:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]">
  <Image
    src={stage.media.url}
    alt={stage.media.alt}
    fill
    sizes="(min-width: 1280px) 760px, 100vw"
    className="object-cover"
  />
</div>
```

**Rule:**

- On mobile, prefer `aspect-[3/2]` or similar that:
  - Shows enough of the subject.
  - Leaves room below for title plus the first line or two of body copy.
- Use slightly more cinematic ratios (`aspect-[4/3]`, `aspect-[16/10]`) on `sm+`.

### 5.2 Gradient scrims over imagery

To maintain legibility when text overlays images:

```tsx
<div
  className="absolute inset-0"
  style={{
    backgroundImage:
      "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
      "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
      "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
  }}
  aria-hidden
/>
```

**Rule:**

- Any text over photography must have a scrim (`var(--scrim-soft)` / `var(--scrim-strong)` or a gradient mix) sufficient to achieve WCAG AA contrast.

### 5.3 Background image performance

- Use `sizes` correctly; avoid `sizes="100vw"` if the image does not visually take full width.
- Keep `priority` for truly above-the-fold hero backgrounds; otherwise, let Next.js lazy-load.

---

## 6. Interaction, Tap Targets & Microcopy

### 6.1 Tap target sizes

**Rule:**

- Every interactive element must be comfortably tappable:
  - Buttons: at least `h-10` (`2.5rem`) or `py-2` with horizontal padding.
  - Text-only links inside dense layouts should be wrapped to expand the hit area:

```tsx
<button className="inline-flex items-center px-3 py-2 text-sm ...">
  Label
</button>
```

### 6.2 Hover vs tap

**Rule:**

- No hover-only behavior. If a component reveals important content on hover (e.g. card reveals body text), mobile must use:
  - Tap-to-expand; or
  - An always-visible variant on mobile.

For example:

```tsx
// If hover class controls visibility
"group-hover:opacity-100"

// In spec
"opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
```

### 6.3 Canonical microcopy

To avoid mixed metaphors:

- Use "Scroll to explore" when vertical scroll is the primary interaction.
- Use "Swipe to browse" only when there is a horizontal carousel with visible controls.
- Use "Tap to expand" for accordions or hidden details.

Any out-of-spec phrase like "click here" or "tap through each stage" (when you actually scroll) should be rewritten:

```tsx
// BEFORE
"Tap through each stage to follow the bespoke process..."

// AFTER
"Scroll through each stage to follow the bespoke process..."
```

---

## 7. Accessibility & Legibility

### 7.1 Minimum sizes & contrast

**Rules:**

- Body text: minimum `text-xs` with generous line-height (`leading-relaxed`).
- Avoid `text-[10px]` except in extreme edge cases (and never for critical information).
- Text over images must have sufficient contrast via scrims/overlays.

### 7.2 Focus & keyboard support

- All interactive elements must have:
  - A clear focus style, e.g. `focus-ring` utility.
  - No removal of outline without replacement (`outline-none` must be paired with a custom focus style).

### 7.3 Reduced motion

- Honor `prefers-reduced-motion`:
  - Disable parallax and heavy scroll-driven motion.
  - Replace complex sequences with simpler opacity or position transitions.

---

## 8. Motion & Performance

### 8.1 Animations

**Rule:**

- On mobile, prefer:
  - Short, subtle transitions (`duration-150`–`duration-250`, `ease-out`).
  - Simple opacity/translate animations.
- Avoid:
  - Continuous parallax tied to scroll on large images where performance may stutter.
  - Excessive layered blurs and shadows combined.

If using Framer Motion:

```tsx
// In spec for mobile: keep transitions lightweight
transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
```

### 8.2 Effects budget

**Rule of thumb:**

- Per viewport on mobile:
  - At most one `backdrop-blur` container, and it should be the **outermost foreground card** (e.g. a main hero or pinned card), not nested inner cards.
  - Inner/nested cards on mobile should be visually flat: `border-none`, `bg-card/0`, and `shadow-none`, relying on spacing and typography for structure rather than additional card chrome.
  - Prefer `shadow-sm` / `shadow-md` to `shadow-xl` on mobile when you *do* need depth on a single outer card; reserve stronger shadows for larger breakpoints.

AI should downgrade overly heavy effects (multiple blurs, deep shadows on many cards) when found at the base breakpoint and move that visual weight to the single outermost card where needed.

---

## 9. Content Density & Truncation

### 9.1 Line clamping

To avoid a "wall of text" on 6" screens:

- In cards / lists:
  - Titles: `line-clamp-2`.
  - Body: up to 4 lines (`line-clamp-4`) with an affordance for more if needed.

Example:

```tsx
<h3 className="text-base font-semibold text-ink line-clamp-2">
  Stage title
</h3>
<p className="text-xs text-ink-muted line-clamp-4">
  Long description...
</p>
```

### 9.2 Paragraph spacing

**Rule:**

- Use `space-y-2` or `space-y-3` to visually separate paragraphs.
- Long explanatory text should be broken into short, scannable paragraphs rather than a single long one.

---

## 10. Component Pattern Specs

These are archetypes. If a component matches one of these patterns, its mobile behavior should follow the rules below.

### 10.1 Hero / Masthead

- Layout (mobile):
  - Stack: eyebrow → heading → subtitle → CTAs.
  - Limit width: `max-w-xl` for text.
- CTAs:
  - Primary: full-width `w-full` or `min-w-full`.
  - Secondary: stacked below or inline; still large tap target.

### 10.2 Card grids

- Mobile:
  - Single column: `space-y-4` or `space-y-6`.
  - No two-column grids (no `grid-cols-2`) below `sm`.
- Card structure:
  - Image (`aspect-[3/2]`) → label → title → short body.
  - Consistent paddings: `p-4`, `rounded-xl` / `rounded-2xl`.
- Note:
  - Card grids are considered standalone card surfaces, not inner/nested cards inside a hero shell. They should use their own border/background/shadow treatments as defined here, even on mobile.

### 10.3 Timelines / steppers

- Desktop:
  - Rail + pinned content, or horizontal progression.
- Mobile:
  - Stacked stages with a clear sense of progression:
    - "Stage X of N" label.
    - Optional scroll-snap between stages.

Example scroll snap:

```tsx
<div className="space-y-10 snap-y snap-mandatory">
  {stages.map((stage) => (
    <div key={stage.id} className="snap-start">
      <TimelineItem stage={stage} />
    </div>
  ))}
</div>
```

---

## 11. Analytics & Instrumentation

### 11.1 Naming pattern

Use a consistent naming format:

```txt
ComponentName.EventName:Detail
```

Examples:

- `CraftTimelineSeen`
- `CraftTimeline.StageSeen:Measurement`
- `CraftTimeline.StageSeen:TunnelTest`
- `CraftTimeline.StageSeen:Finishing`

### 11.2 Mobile visibility tracking

**Rule:**

- Any scrollytelling or multi-stage component must track per-stage visibility on both desktop and mobile.

Implementation options:

- Use `activeStage` changes to log events; or
- Use `IntersectionObserver` / equivalent and fire analytics as each stage comes into view.

---

## 12. How to Use This Guideline with AI

When asking an AI (Codex / GPT) to audit or refactor a component:

### 12.1 Prompt pattern

> Using `Mobile-Design-Guide.md` as the spec, audit `ComponentName.tsx` for mobile behavior.  
> 1. Identify each place where the component violates the guideline (typography, spacing, full-bleed, imagery, tap targets, accessibility, performance, patterns, or analytics).  
> 2. For each violation, briefly describe the issue and reference the rule from the guideline.  
> 3. Modify the code to bring it into spec, using the concrete transformation patterns defined here (e.g. responsive typography, section padding, card shells, scroll-snap, safe areas).  
> 4. Keep the visual language and brand intact; only adjust implementations to conform to this mobile spec.

### 12.2 Priority order of fixes

When making changes, AI should prioritize:

1. Accessibility & legibility
2. Layout & overflow (no horizontal scroll, safe areas)
3. Interaction & tap targets
4. Performance
5. Refinement (animations, microcopy, scroll-snap, etc.)

---

## 13. Summary

A component is "in spec for mobile" when:

- Base styles are tuned for phones, with typography and spacing responsive upward.
- There is no horizontal overflow from full-bleed patterns.
- Text is legible, high contrast, and not crushed by imagery.
- Interactions are thumb-friendly, not hover-dependent, and copy matches the real interaction ("scroll", "swipe", "tap").
- Effects (blur, shadow, motion) are controlled to protect performance.
- Components that share a pattern behave consistently across the site.
- Key narrative / multi-stage components track mobile visibility in analytics.

Any automated or manual refactor should use these rules as the single source of truth for how we treat mobile.