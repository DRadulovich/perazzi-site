# Section Reveal Refactor Spec (Craftsmanship Journey Pattern)

This document captures the full interaction spec and implementation patterns used in the "Craftsmanship Journey" section so you can refactor other sections to match.

## Goal
Create a photography-forward section that starts as a minimal, centered title + subtitle over the background image, then expands into the full component with smooth, cinematic transitions. The expanded state persists until the user explicitly collapses it.

## Behavior Requirements
- Collapsed state (desktop only):
  - Show only title + subtitle, centered both horizontally and vertically.
  - Title + subtitle are white and slightly larger than normal.
  - Show a "Read more" line under the subtitle (type-button) that fades in after the title/subtitle settle.
  - Background image remains visible, covered by a soft scrim.
  - No content cards or overlays are visible.
  - Section height is stable; the page must not grow or shrink during expand/collapse.
- Expand trigger:
  - User can expand by pointer entering the title area, focusing it, or clicking it.
  - Clicking "Read more" also expands the section.
  - On expand, the title/subtitle animate to their normal left-aligned layout.
  - The full component fades/blur-reveals and materializes.
  - Scrim fades out; cinematic overlays (grain/gradient) fade in.
- Expanded state:
  - Remains expanded until the user clicks "Collapse".
  - Cards and surfaces are visible with their standard blur/shadow treatments.
  - Title/subtitle color transitions from white to theme ink colors smoothly (no snap).
- Collapse:
  - Clicking "Collapse" returns to the centered title/subtitle.
  - Title/subtitle animate back to center together.
  - Color transitions back to white smoothly.
  - No height jitter.
- Accessibility:
  - Title is a real heading (aria label stays on it).
  - Expand trigger is a button overlay with aria-expanded + aria-controls.
  - Collapse is a button.
- Desktop only for now:
  - Collapsed/expand interaction only on desktop and when reduced-motion is off.
  - On mobile or reduced motion, section is always expanded.

## Reference Implementation
- `src/components/home/timeline-scroller.tsx`
- `src/styles/site-theme.css` (collapsed typography sizes)
- `src/lib/motionConfig.ts`

## Architecture Pattern
Use a dedicated reveal sub-tree keyed by the desktop/reduced-motion toggle to avoid setState-in-effect.

High-level structure:
- Parent section computes `enableTitleReveal` and passes props.
- Child component (like `TimelineRevealSection`) owns local state:
  - `timelineExpanded` (bool)
  - `headerThemeReady` (bool)
  - `expandedHeight` (number | null)
- The child component is keyed by `enableTitleReveal` to reset local state when the breakpoint changes.

### Key State + Events
- `enableTitleReveal = isDesktop && !prefersReducedMotion`
- `revealTimeline = !enableTitleReveal || timelineExpanded`
- `handleExpand`:
  - sets `timelineExpanded` true
  - uses rAF to set `headerThemeReady` true (smooth color transition)
- `handleCollapse`:
  - sets `headerThemeReady` false immediately
  - sets `timelineExpanded` false
  - cancels any pending rAF
- Clean up rAF on unmount.

### Height Stabilization
Keep the section height static so the page does not jump:
- Add a static `min-h-[calc(640px+18rem)]` (or appropriate for the section).
- Use `ResizeObserver` to capture the expanded height and set a `minHeight` inline while expanded.

## Motion + Transitions
Use the same cinematic easing in `src/lib/motionConfig.ts`:
- `homeMotion.cinematicEase` for section-level transitions.

Reference durations:
- `timelineReveal = { duration: 2.0, ease: homeMotion.cinematicEase }`
- `timelineRevealFast = { duration: 0.82, ease: homeMotion.cinematicEase }`
- `timelineBodyReveal = timelineReveal`
- `timelineCollapse = { duration: 1.05, ease: homeMotion.cinematicEase }`
- `readMoreReveal = { duration: 0.5, ease: homeMotion.cinematicEase, delay: timelineReveal.duration }`

Reusable transition classes:
- `focusSurfaceTransition = "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]"`
- `focusFadeTransition = "transition-opacity duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]"`
- `titleColorTransition = "transition-colors duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)]"`

## Layout Morph (Title + Subtitle)
Use `LayoutGroup` and shared `layoutId`s so the title/subtitle morph between centered and left-aligned layouts.

Example IDs (must be unique per section):
- `section-x-title`
- `section-x-subtitle`

Important:
- Expanded header container should sit above the collapsed overlay:
  - expanded header: `relative z-10`
  - collapsed overlay: `absolute z-0`
- Disable layout crossfading on the shared layout elements to avoid a last-second opacity snap:
  - `layoutCrossfade={false}` on each `motion.div` with a shared `layoutId`

This avoids a “color snap” at the end of the expand animation.

## Background + Overlay Layering
In the section background layer (absolute, full bleed):
- Base: background image
- Collapsed scrim: `bg-(--scrim-soft)` at full opacity when collapsed
- Expanded scrim: `bg-(--scrim-soft)` fading in when expanded
- Film grain + gradient overlays only in expanded state

Reference usage in `src/components/home/timeline-scroller.tsx`.

## Typography Adjustments (Collapsed Only)
New utility classes in `src/styles/site-theme.css`:
- `.type-section-collapsed { font-size: calc(var(--type-section) * 1.1); }`
- `.type-section-subtitle-collapsed { font-size: calc(var(--type-title-md) * 1.1); }`

Apply only in collapsed overlay:
- title: `type-section-collapsed`
- subtitle: `type-section-subtitle-collapsed`
- both also `text-white`
On expand:
- Title uses `text-ink` and subtitle uses `text-ink-muted`, with `titleColorTransition` for the smooth handoff.

## Accessibility + Interaction
- Use a real `<button>` overlay on the title for expand:
  - `onPointerEnter`, `onFocus`, `onClick`
  - `aria-expanded` and `aria-controls`
- Collapse button in expanded header
- Title is the `aria-labelledby` target for the section

## Read More CTA (Collapsed Only)
- Render below the subtitle, centered.
- Typography: `Text size="button"`; use `asChild` to render a `<button>`.
- Fade in only after the title/subtitle settle:
  - `initial={{ opacity: 0, y: 6 }}`
  - `animate={{ opacity: 1, y: 0, transition: readMoreReveal }}`
  - Use `delay: timelineReveal.duration` so it appears after the title/subtitle animation.
- `onClick` expands the section via the same `handleExpand`.

## Checklist For Refactoring A New Section
1. Identify the section title, subtitle, and background media.
2. Create a reveal sub-component keyed by `enableTitleReveal`.
3. Add collapsed overlay with centered title/subtitle and expand button.
4. Wrap title + subtitle in a `LayoutGroup` with unique `layoutId`s.
5. Add expanded header and body content inside `AnimatePresence`.
6. Apply `focusSurfaceTransition`, `focusFadeTransition`, and the scrim/overlay layers.
7. Add `timelineExpanded`, `headerThemeReady`, and rAF color transition.
8. Stabilize height with a `ResizeObserver` + `minHeight` inline style.
9. Ensure expand/collapse persists and does not depend on hover for staying open.
10. Verify collapsed typography uses white text + the larger collapsed size utilities.
11. Add the delayed "Read more" CTA that expands the section on click.

## Notes For GPT-5.2 Codex Handoff
- Reference implementation: `src/components/home/timeline-scroller.tsx`.
- Do not reintroduce setState inside effects for expand/collapse; use the keyed sub-component approach.
- Keep behaviors the same unless explicitly requested.
- If refactoring another section, use unique layoutId strings to avoid cross-section collisions.
