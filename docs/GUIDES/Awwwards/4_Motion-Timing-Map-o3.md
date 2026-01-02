# Motion Timing Map (Auto-generated)

This document maps the primary animated interactions for the audited components.  All timings are normalised to milliseconds (ms).  If a value is physics-based or depends on list length / scroll progress the duration is marked *variable* and a plain-English note is added.

Legend
- FR = Framer Motion
- TW = Tailwind / CSS utility classes
- *homeMotion* – shared easing/transition config in `src/lib/motionConfig.ts`

---

## A) Summary tables

| Component | Interaction | Phase | Total time | What determines it | Notes |
|-----------|-------------|-------|------------|--------------------|-------|
| `home/timeline-scroller.tsx` | Expand (click / hover / focus on collapsed title area) | open | 2000 ms + stagger | `timelineReveal.duration` (2 s) + staggerChildren (≤12×N) | Desktop only; on mobile the timeline is always expanded. |
|  | Collapse (click **Collapse**) | close | 1050 ms | `timelineCollapse.duration` | |
| `home/marquee-feature.tsx` | Expand | open | 2000 ms + stagger | `marqueeReveal.duration` | Same pattern as Timeline. |
|  | Collapse | close | 1050 ms | `marqueeCollapse.duration` | |
| `shotguns/PlatformGrid.tsx` | Expand | open | 2000 ms + stagger | `platformReveal.duration` | Tabs & cards add further stagger (≈0.27 s per tab, 0.1 s per card). |
|  | Collapse | close | 1050 ms | `platformCollapse.duration` | |
| `shotguns/DisciplineRail.tsx` | Expand | open | 2000 ms + stagger | `railReveal.duration` | Multiple nested staggers (header 0.12 s, lists 0.1 s). |
|  | Collapse | close | 1050 ms | `railCollapse.duration` | |
| `shotguns/TriggerExplainer.tsx` | Expand | open | 2000 ms + stagger | `explainerReveal.duration` | Uses `Collapsible` for mobile details—opened instantly there. |
|  | Collapse | close | 1050 ms | `explainerCollapse.duration` | |
| `shotguns/EngravingGradesCarousel.tsx` | Expand | open | 2000 ms + stagger | `carouselReveal.duration` | Categories list has heavier stagger (0.25 s). |
|  | Collapse | close | 1050 ms | `carouselCollapse.duration` | |
| `bespoke/BuildStepsScroller.tsx` | Scroll-linked pinning | other | variable | `useScroll` transform 0–100 % of section | Animation progresses with scroll, no fixed duration. |
| `experience/ExperiencePicker.tsx` | Mount (in view) | enter | 820 ms | `homeMotion.revealFast` | Simple fade/slide list. |
| `experience/VisitFactory.tsx` | Mount (in view) | enter | unknown | **TODO** file contains no explicit FR variants; only CSS classes – requires design confirmation. |
| `experience/BookingOptions.tsx` | Mount (in view) | enter | 820 ms | `homeMotion.revealFast` | |
| `experience/TravelNetwork.tsx` | Mount (in view) | enter | variable | network graph animates via CSS keyframes (`animate-spin` etc.) – continuous. |
| `heritage/ChampionsGallery.tsx` | Carousel change | other | variable | Spring (`layout` + `springHighlight`) | Timing depends on physics parameters. |

Components not listed have either no explicit animation definitions or rely exclusively on standard CSS hovers; they are omitted for brevity.

---

Below you will find a detailed timeline for each interaction/phase that uses the shared *cinematic* reveal pattern (2 s open / 1.05 s close).  The table only lists the highest-level pieces; nested child lists inherit an additional stagger noted in the **Formula** column.

### 1. `src/components/home/timeline-scroller.tsx` – Expand

| Step | Piece | What changes (prop/CSS) | Start (ms) | Start % | Duration (ms) | Delay (ms) | Stagger (ms) | End (ms) | Easing | Formula | Source |
|------|-------|-------------------------|------------|---------|---------------|------------|--------------|----------|--------|---------|--------|
| 1 | Section container | opacity 0→1 | 0 | 0 % | 2000 | 0 | — | 2000 | cinematicEase | — | timelineReveal (≈l120) |
| 2 | Header block | opacity, y, blur | 200 | 10 % | 2000 | 200 | 120 | 2200 | cinematicEase | child_i = 200 + 120·i | headerBlock def |
| 3 | Body block | opacity, y | 360 | 18 % | 2000 | 360 | 100 | 2360 | cinematicEase | child_i = 360 + 100·i | bodyBlock def |
| 4 | Background image | scale 1.32→1 | 0 | 0 % | 2000 | 0 | — | 2000 | cinematicEase | — | parallaxScale |

Plain-English: The wrapper fades/zooms for two seconds. 0.2 s in, header lines begin cascading; 0.36 s in, body text starts. Each cascade adds 0.12 s (header) or 0.1 s (body) per child.

Reduced-motion: With `prefersReducedMotion` all Framer Motion props are disabled; elements appear instantly.

### Collapse

Identical pieces animate in reverse using `timelineCollapse` (1050 ms). Stagger maths unchanged.

---

### 2. `src/components/home/marquee-feature.tsx`

Follows the same pattern as Timeline but uses `marquee*` variables. All numeric values equal those in table 1.

---

### 3. `src/components/shotguns/PlatformGrid.tsx` – Expand

| Step | Piece | What changes | Start | % | Duration | Delay | Stagger | End | Easing | Formula | Source |
|------|-------|-------------|-------|---|----------|-------|---------|-----|--------|---------|--------|
| 1 | Container | opacity | 0 | 0 | 2000 | 0 | — | 2000 | cinematicEase | — | platformReveal |
| 2 | Header group | opacity/y | 280 | 14 | 2000 | 280 | 120 | 2280 | cinematicEase | child_i = 280 + 120·i | headerContainer |
| 3 | Tabs | opacity/y | 420 | 21 | 820 | 420 | 270 | 1240+ | revealFast | tab_i = 420 + 270·i | tabListVariants |
| 4 | Card rail | opacity/y | 540 | 27 | 820 | 540 | 100 | 1360+ | revealFast | card_i = 540 + 100·i | railVariants |

Timing explanation: Tabs appear every 270 ms; cards 100 ms apart. So total runtime increases with number of items.

Reduced motion: Disables all FR props; cards appear without stagger.

---

### 4–6. DisciplineRail / TriggerExplainer / EngravingGradesCarousel

All three use the same 2 s open / 1.05 s close base plus nested staggers:
- Header children: 120 ms
- Category list items: 100 ms (Discipline), 250 ms (Engraving)
- Nested list: 80 ms per item

Formula for total: `2000 + headerStagger·(h-1) + listStagger·(c-1) + nestedStagger·(n-1)` where *h* = header children, *c* = categories, *n* = items in expanded category.

---

### 7. Scroll-linked components

`BuildStepsScroller`, some hero banners, and parallax backgrounds map scroll progress (0→1) to transforms (translateY, scale).  Duration is therefore *variable*; the animation only completes when the user scrolls the full section height.

---

### Reduced-motion & breakpoints

Across all audited components:
1. `useReducedMotion()` short-circuits Framer Motion props (`variants`, `animate`, `whileHover`, etc.)
2. Layout-dependent features (pinning, parallax) are **disabled** on `<1024px` viewports.
3. CSS `transition-*` utilities remain (≤300 ms) and are considered acceptable for WCAG.

---

*Generated automatically on 2026-01-02*
