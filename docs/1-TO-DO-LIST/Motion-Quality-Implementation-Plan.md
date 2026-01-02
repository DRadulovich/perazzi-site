You are Codex 5.2 editing a Next.js (App Router) + React + Tailwind + Framer Motion codebase.

TARGET_FILE: <`src/components/bespoke/BuildStepsScroller.tsx`>

Goal
Upgrade this section’s motion choreography so it feels premium and intentional: stagger the “atmosphere” layers and the content elements so they animate independently, smoothly, and without changing the layout, copy, or behavior.

Non‑negotiables
- Zero jitter/jumps/CLS; no broken interactions; no prop/API changes required by parent callers.
- Respect reduced motion (`useReducedMotion`): in reduced motion, render the final visual state (no stagger/delays/blur/transforms).
- Reuse existing motion tokens/patterns in this repo (notably `src/lib/motionConfig.ts` and existing section patterns). No new dependencies.
- Prefer GPU-friendly properties (`opacity`, `transform`; optional small `filter: blur()` on text only). Avoid animating layout properties.
- Don’t edit `*.orig` files.

Do now (no questions)
1) Open TARGET_FILE (and only the minimal directly-related child components it imports if necessary to split animations cleanly).
2) Map the section into animation groups:
   - Atmosphere: background media, scrims, grain, gradients, glows.
   - Header: eyebrow/title/subtitle.
   - Body: copy/CTAs/controls.
   - Repeated items: cards/rails/slides/list items (index-based delay).
3) Create a cohesive “score” (subtle, not flashy):
   - Atmosphere comes in first (slow fade/scale), then header, then body, then repeated items.
   - Use stagger ~0.08–0.14s, y-offset ~8–16px, and existing easing/timing tokens (avoid bouncy effects).
4) Implement with Framer Motion in a single coherent approach:
   - Use parent `variants` with `staggerChildren`/`delayChildren`, and make children `motion.*` so they animate independently.
   - If using scroll-triggered entrance, use `whileInView` + `viewport={{ once: true, amount: 0.25 }}` consistently (don’t double-animate the same props via CSS transitions + Framer).
   - If the section expands/collapses or swaps content, keep layout stable (reuse existing `minHeight`/ResizeObserver or existing `layout` patterns already present).
5) Ensure reduced-motion mode is pristine (no delays/staggers/blur/transforms; content fully readable immediately).
6) Validate: run `pnpm lint` + `pnpm typecheck` (and `pnpm test` if it’s fast here). Fix only issues introduced by your changes.

Output
- Brief summary of what now staggers (atmosphere + header + body + repeated items).
- Tiny QA checklist (desktop/mobile, reduced motion, scroll, hover/focus, no layout shifts).
Start implementing immediately.

[x] src/components/home/timeline-scroller.tsx

[x] src/components/home/marquee-feature.tsx

[x] src/components/shotguns/PlatformGrid.tsx

[x] src/components/shotguns/DisciplineRail.tsx

[x] src/components/shotguns/TriggerExplainer.tsx

[x] src/components/shotguns/EngravingGradesCarousel.tsx

[x] src/components/bespoke/BuildStepsScroller.tsx

[x] src/components/experience/ExperiencePicker.tsx

[x] src/components/experience/VisitFactory.tsx

[x] src/components/experience/BookingOptions.tsx

[x] src/components/experience/TravelNetwork.tsx

[x] src/components/heritage/ChampionsGallery.tsx



---



You are an animation timeline mapper for this Next.js/React repo.

Animation tech to consider (repo-wide):
- Framer Motion (motion.*, variants, AnimatePresence, LayoutGroup, layout/layoutId, whileInView/whileHover/whileTap, useScroll/useTransform)
- Tailwind/CSS transitions/animations (transition-*, duration-*, delay-*, ease-*, animate-*, keyframes)
- Shared timing configs (ex: `src/lib/motionConfig.ts`)

Important:
- Do NOT assume every component has the same interaction triggers, states, or number of animated pieces.
- Discover the interactions and animation steps per component from the code.
- If something can’t be determined from code, write `unknown` and say what’s missing (don’t guess).

Goal:
For EACH component path I provide, produce timelines for:
1) Expand/Open (if the component has an “open/expanded” state)
2) Collapse/Close (if the component has a “closed/collapsed” state)
If a component does not have expand/collapse, map its primary animated interaction(s) instead (e.g., enter/exit, hover, scroll reveal), clearly labeled.

How to analyze each component:
1) Identify what starts the animation (“interaction start”): click/press, hover, focus, scroll into view, scroll progress, state change, mount/unmount, etc.
2) Find ALL animation definitions involved in that interaction, including:
   - Framer Motion: variants (hidden/show/exit/etc), transition objects, delay, staggerChildren, delayChildren, nested variant groups, AnimatePresence exit timing, layout/layoutId transitions.
   - Tailwind/CSS: conditional class toggles built via `cn(...)` or template strings, and the timing classes (duration-*, delay-*, ease-*). Note which CSS properties change between states (opacity, max-height, transform, filter, etc.).
   - Imported helpers/configs (e.g., `homeMotion.revealFast`) and child components that animate as part of the interaction. If you can’t fully expand a child, at least list it as a dependency with its file path.
3) Normalize timing units to milliseconds:
   - Framer Motion duration values are seconds → multiply by 1000.
   - Tailwind `duration-300`, `delay-2000` are milliseconds as-is.
4) Build a timeline per Interaction + Phase:
   - Start offset (ms) from interaction start
   - Duration (ms)
   - End offset (ms) = start + duration (when duration is fixed)
   - Stagger (ms) if siblings are staggered, and how it affects each item’s start time
   - Total time for the phase = max(end offset) across all steps
5) Handle non-fixed timing:
   - Scroll-linked animations (useScroll/useTransform): mark total time as `variable` and describe it using scroll progress (e.g., “0%→100% of section scroll”).
   - Spring animations with no explicit duration: mark duration/total as `variable` and explain it’s physics-based.
   - Runtime-dependent counts (lists), measurements, or conditional branches: give a formula.

Output (Markdown) — per component:

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |

B) Detailed timeline table (one per Interaction + Phase)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |

*If total time is variable/unknown, leave Start (% of total) as `n/a`.

After each detailed table, if ANY Formula/variable timing exists, add:
- Plain-English timing explanation (non-dev, 1–2 sentences). Example: “Each item starts 120ms after the previous one, so the more items there are, the longer the whole sequence takes.”

Also include a short “Reduced motion / breakpoint differences” note if timings change or animations disable based on `useReducedMotion`, media queries, etc.

Components to audit:
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