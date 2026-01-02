# Motion Quality Implementation Plan

Goal: Elevate animation order, transitions, and performance for Awwwards-level polish across the specified components.
Scope is motion only: no content or layout changes unless required to support sequencing or performance.

## Principles and Baseline
- Motion hierarchy: background -> title/eyebrow -> controls -> primary media -> body copy -> CTA.
- Motion budget: prefer transform/opacity; avoid large-area blur on parents.
- Reduced motion: gate all non-essential effects (blur, parallax, clipPath) behind `useReducedMotion`.
- Consistency: align durations/easing across sections so the site feels authored by one hand.

## Global System Updates (Apply First)
1) Motion tokens
   - Extend `src/lib/motionConfig.ts` with shared tokens:
     - `revealSlow`, `reveal`, `revealFast`, `collapse`, `micro`, `staggerShort`, `staggerLong`.
   - Ensure each section uses these tokens instead of ad-hoc durations.

2) Order-of-operations utilities
   - Define a shared pattern for section headers:
     - Title and eyebrow stagger: 120-160ms.
     - Body reveal delay: 200-300ms after header.
     - "Read more" button delay: 200ms after header or 100ms after body.
   - Use variants for `headingContainer` and `headingItem` to keep ordering consistent.

3) Avoid double blurring
   - Remove blur from large container animations when children already blur.
   - Limit blur to small wrappers (e.g., card shells or media wrappers).

4) Parallax + scroll listeners
   - Only attach parallax transforms when the section is expanded and in view.
   - Add `useInView` or an intersection observer to disable scroll work offscreen.

5) Height locking
   - Use `ResizeObserver` only during expand/collapse.
   - Prefer CSS `min-height` or `content-visibility: auto` for long stacks where possible.

## Component Implementation Details

### Homepage
1) `TimelineScroller` (`src/components/home/timeline-scroller.tsx`)
   - Split the reveal into phases: background fade -> header -> controls -> panel.
   - Use `AnimatePresence mode="wait"` for title/body switches to prevent overlap.
   - Replace large `filter: blur()` on the body container with a smaller wrapper blur on the panel.
   - Simplify `clipPath` animation to a mask/scale on the media wrapper (or shorten its duration).

2) `MarqueeFeature` (`src/components/home/marquee-feature.tsx`)
   - Lead with the portrait (image) reveal, then stagger eyebrow/title/subtitle/quote.
   - Reduce the "Read more" delay to keep the collapsed state from feeling slow.
   - Use `mode="wait"` to avoid title and body exiting simultaneously.

### Shotguns Page
1) `PlatformGrid` (`src/components/shotguns/PlatformGrid.tsx`)
   - Mobile carousel: replace scroll handler with `IntersectionObserver` or rAF throttling.
   - Stagger highlight and content: tab highlight snaps, content fades with short delay.
   - Champion highlight: shorten delay and add direction-aware entry/exit on tab change.

2) `DisciplineRail` (`src/components/shotguns/DisciplineRail.tsx`)
   - Animate accordion open/close (height + opacity) for category lists.
   - Apply a brief transition to the selected card swap for continuity.
   - Keep per-item hover motion minimal; avoid extra blur on lists.

3) `TriggerExplainer` (`src/components/shotguns/TriggerExplainer.tsx`)
   - Align the collapsible open/close timing with the section reveal tokens.
   - On mobile, reduce motion inside `CollapsibleContent` to avoid stacking transitions.
   - Ensure the body content does not animate twice (parent + children).

4) `EngravingGradesCarousel` (`src/components/shotguns/EngravingGradesCarousel.tsx`)
   - Use shared-element style transitions for grade image/title (layoutId).
   - Shorten the blur on grade swap and rely on opacity/translate.
   - Keep list-to-card transition ordered: list item highlight -> card content reveal.

### Bespoke Page
1) `BuildStepsScroller` (`src/components/bespoke/BuildStepsScroller.tsx`)
   - Replace `onViewportEnter` with a scroll-root `IntersectionObserver` for active step.
   - Add `motionEnabled` gating to the step expand/collapse animation.
   - Reduce heavy overlays (film grain, glint) during scroll for performance.
   - Add `content-visibility: auto` and `contain-intrinsic-size` for offscreen steps.

### Experience Page
1) `ExperiencePicker` (`src/components/experience/ExperiencePicker.tsx`)
   - Remove blur on the body container; keep blur on each card only.
   - Stagger cards with `variants` to keep the reveal consistent.
   - Ensure hover motion is subtle and does not fight entry motion.

2) `VisitFactory` (`src/components/experience/VisitFactory.tsx`)
   - Add layout/height transition for the "What to expect" collapsible.
   - Align copy and map reveals so the left column settles before CTA buttons.

3) `BookingOptions` (`src/components/experience/BookingOptions.tsx`)
   - Animate scheduler panel with clip/opacity, not height-only.
   - Pause parallax while the scheduler is open to avoid scroll jank.
   - Ensure CTA cards have a single entry animation (no parent blur).

4) `TravelNetwork` (`src/components/experience/TravelNetwork.tsx`)
   - Use `AnimatePresence mode="wait"` for tab panel swaps.
   - Avoid double animation for list items by moving stagger to the panel container only.
   - Keep tab highlight quick (spring) and list content slower (revealFast).

### Heritage Page
1) `ChampionsGallery` (`src/components/heritage/ChampionsGallery.tsx`)
   - Reveal filters after header settles (staggered).
   - Animate champion list updates with `AnimatePresence` on items.
   - Swap detail card using `layoutId` for image/title to feel like a direct handoff.
   - Reduce blur on the container; keep motion inside card content only.

## Performance Checks
- Limit `filter: blur()` to small elements; avoid on large containers.
- Use `will-change` only on elements actively animating.
- Prefer `transform` and `opacity` to layout-affecting properties.
- Validate that parallax is disabled when reduced motion is requested.

## QA / Verification
- Manual pass on each page:
  - Verify reveal order matches: background -> header -> controls -> body -> CTA.
  - Ensure no overlapping enter/exit on collapse/expand.
  - Check that tab switches and accordion opens feel intentional and not busy.
- Reduced motion:
  - Confirm all parallax/blur/clipPath animations are disabled.
  - Verify content is still readable and transitions are not abrupt.
- Performance:
  - Scroll each section with devtools performance open and confirm no long tasks.

## Suggested Implementation Order
1) Global motion tokens and shared timing order.
2) Homepage sections (Timeline, Marquee) to set the bar.
3) Shotguns (PlatformGrid -> DisciplineRail -> TriggerExplainer -> EngravingGrades).
4) Bespoke BuildStepsScroller.
5) Experience sections.
6) Heritage ChampionsGallery.

