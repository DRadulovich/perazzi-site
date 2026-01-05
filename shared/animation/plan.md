# Animation Choreography Plan

## Global choreography guidelines
- **Tokens**: durations `micro 120ms`, `short 180ms`, `base 320ms`, `long 520ms`; distance `tight 8px`, `base 12px`, `wide 18px`; stagger window `70-110ms`. Use ease-out for enter, ease-in for exit, and "hero" easing for large reveals. (No new deps.) The shared `dreamyPace` profile can override these.
- **Primitives**: `choreoFadeLift` (opacity + y-lift), `choreoSlide` (x/y slide), `choreoScaleParallax` (subtle scale/translate for media), `choreoMaskWipe` (clip + gradient reveal with tunable feather), and `ChoreoGroup` to wrap `RevealGroup`/`RevealItem` with auto-stagger and state classes.
- **Stagger shaping**: use soft overlap (stagger ~70% of duration). Cap long sequences by clamping max index or reducing stagger after N items.
- **Phases**: structure sequences into phases (backdrop -> header -> content) using group delays so the sequence feels intentional, not linear.
- **Swaps**: keyed `presence` classes for selection/tab changes; default exit = fade + 8px down over 180ms (ease-in), enter = fade + 12px up over 260ms (ease-out). Optional 0.98 -> 1 scale and subtle blur for premium panel swaps. Avoid DOM remount where possible. Use `dreamyPace` for extended swaps where desired.
- **Performance**: stick to opacity/translate/mask; pre-measure with `useRevealHeight` for height animations; set animation CSS vars on mount to avoid layout thrash; keep pinned/scroll sections GPU-friendly.

## Component choreography plan

### [x] `src/components/home/timeline-scroller.tsx`
- Section entrance: backdrop parallax fade (phase 1), then collapsed header lifts in (phase 2). When expanded, heading + eyebrow + instructions cascade (phase 3, dreamy pace).
- Pinned layout: stage list buttons cascade (Stage 1->N), active pill pulses softly. Stage panel uses scale-parallax on image (mask-wipe removed due to rendering issues), then stage meta (label, title, body, caption) staggered; body text can reveal line-by-line using newline splits.
- Stacked layout: each accordion card lifts on reveal; inner `TimelineItem` content cascades (image -> title -> copy). Active/collapse transitions crossfade with 8px slide and `ChoreoPresence`.
- On stage change (pinned): crossfade/slide between panels with subtle zoom-out of previous, zoom-in of next; maintain scrim overlay fade synced to image. Use `ChoreoPresence` with optional 0.98->1 scale and slight blur; timings may use `dreamyPace`.

### [x] `src/components/home/marquee-feature.tsx`
- Entrance: portrait scales from 1.04->1.0 with fade; eyebrow, name, subtitle, quote, CTA cascade. Use hero easing for the portrait, dreamy pace for text.
- Title-reveal expand: collapsed header lifts; expand animates shell height smoothly, then content group staggers.
- Optional article link arrow glides right on hover with trailing underline animation (micro duration).

### [x] `src/components/shotguns/PlatformGrid.tsx`
- Header: heading + subtitle slide up; collapse/expand crossfade.
- Tabs: pill buttons slide in; active underline animates left->right on selection (dreamy pace by default).
- Mobile carousel: each card enters with slide-in from right and fade; on scroll/selection, champion highlight crossfades with slight parallax on avatar.
- Desktop grid: cards and champion highlight swap via `ChoreoPresence` (dreamy pace), with avatar scale-parallax. Use phase delays: image -> meta -> CTA.

### [x] `src/components/shotguns/DisciplineRail.tsx`
- Category list: category cards slide down sequentially; expanding a category runs a height animation with staggered discipline pills.
- Detail card: hero image mask-wipe (feathered), heading lift, body prose fade, recommended platform pills cascade, model buttons scale/fade individually.
- Modal: overlay fades, content scales from 0.98->1 with opacity; detail grid items stagger horizontally.

### [x] `src/components/shotguns/TriggerExplainer.tsx`
- Collapsible header: title/subtitle lift; mobile trigger button pulses on hover (micro duration).
- Content: copy block fades/lifts, link chips slide in from left with 50ms stagger; diagram card uses mask-wipe + gradient reveal, caption fades in last.
- Manual open/close: height animation plus entry/exit of content with controlled opacity/translate. Use `useRevealHeight` for stable min-height.

### [x] `src/components/shotguns/EngravingGradesCarousel.tsx`
- Category accordion: cards slide down; grade pills cascade; active pill underlay grows.
- Grade card: hero image mask-wipe; "Engraving Grade" label, name, description, CTA staggered; CTA underline animates on hover.
- Category change: fade/slide swap of grade card with short exit/enter timings. Optional subtle scale/blur for premium swap.

### `src/components/bespoke/BuildStepsScroller.tsx`
- Section intro: heading/subheading/instructions cascade; anchor buttons slide in from sides.
- Rail nav (desktop): pills sweep in; active indicator animates width/position.
- Each step panel: background image parallax-fade on entry; card lifts with mask-wipe; title, read-more toggle, body, CTA/dots cascade. Mobile dots fade/scale.
- Scroll-activated step change: apply subtle crossfade + y-offset reset so the active card feels pinned while backgrounds swap. Use `ChoreoPresence` on panels.

### `src/components/experience/ExperiencePicker.tsx`
- Grid cards cascade row-by-row: image mask-wipe, micro-label, title, summary, CTA arrow. Clamp stagger after row two.
- FAQ block: heading and lead lift, then questions list items fade/slide with short stagger.

### `src/components/experience/VisitFactory.tsx`
- Left column: labels/heading/address fade-lift; map panel mask-wipe + scrim fade; "Open in Maps" slides right.
- Right column: "What to expect" collapsible height animation; caret rotates; body copy fades. CTA button scales from 0.98->1 with shadow bloom.

### `src/components/experience/BookingOptions.tsx`
- Options grid: cards stagger with lift; inside each, title/duration/copy/CTA cascade.
- Scheduler card: header + button enter together; on toggle, panel height animates and iframe fades in; fallback skeleton fades out when iframe loads.

### `src/components/experience/TravelNetwork.tsx`
- Header cascade; tab pills slide in with active underlay animation.
- Tab switch choreography: fade/slide old list out 80px up, new list in from 24px down. Cards within list stagger.
- Schedule cards: date, title, location stagger; dealers: name, state, address stagger.

### `src/components/heritage/ChampionsGallery.tsx`
- Filters: pill buttons slide in; active pill underlay animates.
- Champion list: names cascade; active item background grows; on selection, detail pane swaps with fade/slide and image mask-wipe.
- Detail content stagger: hero image, name, highlights list, bio, quote, discipline/platform pills, CTA.

## Implementation order
1) Build shared choreo tokens/helpers (ensure reduced-motion support).
2) Apply to home sections (timeline, marquee) to validate patterns.
3) Shotguns sections (grid, discipline, trigger, engraving) with selection/tabs handling.
4) Bespoke and experience flows.
5) Heritage gallery.
