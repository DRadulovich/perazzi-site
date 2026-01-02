You are Codex 5.2 editing a Next.js (App Router) + React + Tailwind + Framer Motion codebase.

TARGET_FILE: <`src/components/shotguns/TriggerExplainer.tsx`>

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

[ ] src/components/shotguns/EngravingGradesCarousel.tsx

[ ] src/components/bespoke/BuildStepsScroller.tsx

[ ] src/components/experience/ExperiencePicker.tsx

[ ] src/components/experience/VisitFactory.tsx

[ ] src/components/experience/BookingOptions.tsx

[ ] src/components/experience/TravelNetwork.tsx

[ ] src/components/heritage/ChampionsGallery.tsx