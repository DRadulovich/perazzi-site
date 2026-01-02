# Expandable Section Motion System (Shared Timeline)

## Goal
Implement a standardized expand/collapse motion system that can be reused across these sections:

- `src/components/home/timeline-scroller.tsx`
- `src/components/home/marquee-feature.tsx`
- `src/components/shotguns/PlatformGrid.tsx`
- `src/components/shotguns/DisciplineRail.tsx`
- `src/components/shotguns/TriggerExplainer.tsx`
- `src/components/shotguns/EngravingGradesCarousel.tsx`
- `src/components/bespoke/BuildStepsScroller.tsx`
- `src/components/experience/ExperiencePicker.tsx`
- `src/components/experience/VisitFactory.tsx`
- `src/components/experience/BookingOptions.tsx`
- `src/components/experience/TravelNetwork.tsx`
- `src/components/heritage/ChampionsGallery.tsx`

## Shared Interaction Model
Each section has two states: `collapsed` and `expanded`.

### Collapsed state (default)
- Section container presents at ~60vh (or equivalent visual height).
- Visible: collapsed title, collapsed subtitle, "Read More" (centered).
- Strong scrim overlay + subtle parallax background motion.

### Expand triggers
- Primary trigger: click/tap on "Read More" (and/or the header area).
- Optional desktop enhancement: hover can highlight/tease but should NOT expand unless explicitly enabled.

### Collapse trigger
- Click/tap "Close" (or re-click header), or Escape key.
- Optional: clicking outside collapses (if safe).

## Shared Section Anatomy (Contract)
Each expandable section should map into this structure:

- Background layer (image/video) + parallax transform (optional)
- Top + bottom gradient scrims (animated)
- Collapsed header group (title/subtitle/CTA)
- Expanded foreground container (glass container or card stack) (optional)
- Expanded header group (title/subtitle/eyebrow)
- Content block (component-specific UI)
- CTA/buttons row

Sections that don’t use glass still follow the same child-variant contract; they simply omit the glass node.

## Motion Timeline (Collapsed -> Expanded)
Use Framer Motion variants. Child elements animate via staggered reveal.

0) Background "pre-zoom" (anticipation beat)
   - On expand trigger, animate the background media to a framing that matches the expanded section height BEFORE the section container expands.
   - This is a subtle zoom adjustment to reduce perceived stretching when the container expands.
   - Implementation note: prefer animating `scale` (and optionally `y` / `transform-origin`) on the background layer, not the container.
   - Timing: short (e.g. 120–220ms * EXPAND_TIME_SCALE), then proceed to step 1.

1) Container expansion
   - Expand section from collapsed height to expanded layout height (layout animation preferred).

2) Scrims converge + collapsed header fades out
   - Top/bottom gradients animate toward center.
   - Collapsed title/subtitle/CTA fade out in sync.

3) Foreground glass container (if present) expands from center
   - Scale/opacity/blur animation as appropriate.

4) Expanded header reveals
   - Expanded title/subtitle animate in (letter-by-letter for short text only).
   - Eyebrow fades in.

5) Main card/image reveals
   - Card and image fade/slide in.

6) Card meta reveals (if present)
   - Eyebrow/title/subtitle appear top-to-bottom.

7) Body text reveal
   - Reveal by line/paragraph (not per-letter).

8) Lists/accordions/columns reveal (if present)
   - Stagger items top-to-bottom.

9) CTA/buttons reveal
   - Fade/slide in last.

## Motion Timeline (Expanded -> Collapsed)
Reverse the same sequence at ~2x speed.
- Collapse should feel snappy but not abrupt.
- Ensure no “pop” at end: elements should fully finish their exit before container returns to collapsed state.
- Background should return from expanded framing back to collapsed framing as part of the reverse sequence (mirror of step 0).

## Global Tuning Knobs (Single-File)
All timings must be controlled by shared constants in one module:
- `EXPAND_TIME_SCALE` (multiplies all expand durations/delays)
- `COLLAPSE_TIME_SCALE` (multiplies all collapse durations/delays; default = EXPAND_TIME_SCALE * 0.5)

Also centralize:
- Easing curves
- Base durations for each step (including background pre-zoom)
- Stagger values (children + letters + list items)

## Accessibility + Performance Requirements
- Respect `prefers-reduced-motion`: reduce or disable letter-by-letter and heavy parallax.
- Keyboard support: Enter/Space triggers expand, Escape collapses.
- Avoid animating to/from `height: auto` directly; use layout animation or measured height.
- Prevent scroll-jump on expand: keep the expanded section anchored (scrollIntoView if needed).