# Animation & WebGL Performance Action Plan

## Quick wins (low effort / high impact)

1. **Coalesce the `PlatformGrid` scroll handler so layout reads happen once per frame.**
   - *What to change:* Wrap the `handleScroll` inside `requestAnimationFrame`/`rafId` guard so `getClosestCardIndex` (the bounding-box scan at `src/components/shotguns/PlatformGrid.tsx:173-194`) and the subsequent `setActiveIndex` call run at most once per frame, and only update state when the computed index changes. Drop the `querySelectorAll` loop when the container is already decently centered. 
   - *Why it helps:* It eliminates the thrash of calling `getBoundingClientRect` for every card on every scroll event, so the browser can batch layout work and React will not rerender dozens of times per second.
   - *Where:* `src/components/shotguns/PlatformGrid.tsx:173-196` for the helper + `:682-696` for the scroll listener and state updates.
   - *How to verify:* Record a DevTools Performance trace of the `PlatformGrid` while scrolling on desktop; the “Scroll” event durations and “Layout”/“Paint” slices should shrink, and the React Profiler should report fewer renders for `PlatformGridBody`. Look for a drop in “Rendering > Scroll” time and fewer `setState` call stacks in flame charts.
   - *Impact/Confidence:* Medium-high impact on CPU (reduces ~10 layout reads per frame); confidence high.

2. **Pause `SectionBackdrop` parallax when sections are off-screen and remove long-running scroll/resize listeners.**
   - *What to change:* Add an `IntersectionObserver` or `useInView` guard inside `useParallaxBackground` (`src/hooks/use-parallax-background.ts:6-63`) so it only registers scroll/resize listeners (and runs its rAF loop) when the section is within ~120 % viewport. Signal `SectionBackdrop` to disable parallax when the parent `SectionShell` is collapsed (the `reveal` flag is false).
   - *Why it helps:* Prevents dozens of `requestAnimationFrame` loops from firing every scroll tick on sections that are hidden or scrolled past, which cuts CPU usage and paint churn during long scrolls.
   - *Where:* `src/hooks/use-parallax-background.ts:20-60` plus `src/components/ui/section-reveal/section-backdrop.tsx:19-56` to respect the guard.
   - *How to verify:* In DevTools Performance, re-record the same scrolls from before—`scroll` listeners and “Paint” slices tied to those sections should disappear when they are off-screen. `Layers` panel should show fewer overscroll composites. Compare `Main` thread idle time and observe the absence of repeated `requestAnimationFrame` entries for those sections.
   - *Impact/Confidence:* Medium impact on both CPU/GPU by reducing rAF loops; confidence medium since it depends on observer configuration.

3. **Restrict or remove the WebGL smoke simulation when the collapsed CTA is not under the pointer.**
   - *What to change:* In `reveal-collapsed-header.tsx:101-155`/`section-reveal-smoke.tsx:53-143`, only mount `SectionRevealSmoke` when the button is within the viewport and the pointer is actually moving (e.g., add a distance threshold or `requestAnimationFrame` throttle) or fall back to a CSS gradient when `prefers-reduced-motion` or a battery saver flag is active. Consider deferring `createFluidSmoke` until `pointerenter` and keep it `null` when the section is collapsed and scrolled off-screen.
   - *Why it helps:* Cuts the runtime of the 8-pass fluid shader (`src/lib/fluid-smoke.ts:700-804`) to the moments of actual interaction, avoiding sustained GPU draw calls and keeping fans/battery usage down.
   - *Where:* `src/components/ui/section-reveal/reveal-collapsed-header.tsx:101-155`, `src/components/ui/section-reveal/section-reveal-smoke.tsx:53-143`, and optionally the smoke helper (`src/lib/fluid-smoke.ts:700-804`) to expose a lightweight “inactive” path.
   - *How to verify:* In Chrome’s Performance panel, filter for `WebGL` or `Canvas` events and note the `draw` counts before/after while hovering the CTA. Use the Rendering panel’s “Show WebGL stats” option to confirm the context is not active (or `GPU` timeline shows fewer tasks). Also check `chrome://gpu` to ensure the gl context is destroyed sooner.
   - *Impact/Confidence:* High impact for GPU load during hover; confidence medium because it affects the desired effect but should maintain the visual if swapped to a static texture.

## Medium effort refactors

1. **Throttle `HeritageEraSection` state updates so `activeEventIndex` only changes once per segment.**
   - *What to change:* Replace the current incremental threshold logic (`src/components/heritage/HeritageEraSection.tsx:86-117`) with a quantized, `Math.round`-style bucket or a cached progress ref so `setActiveEventIndex` fires at most once per 0.15 progress change. Keep the `useMotionValueEvent` for the rail but store state in refs and flush to React only when the bucket really moves (and consider `requestAnimationFrame` batching).
   - *Why it helps:* Cuts the number of React renders triggered by continuous scroll values, reducing the CPU work inside the era rail and the rest of the page.
   - *Where:* `src/components/heritage/HeritageEraSection.tsx:86-117` plus any callbacks wired into `onActiveEventChange`.
   - *How to verify:* Use the React Profiler to record while scrolling the heritage section—check that `HeritageEventRail` and related components render less frequently (fewer `render` operations), and compare the raw `setState` counts before/after. In the Performance panel, you should see fewer “Update” slices during a flick through multiple eras.
   - *Impact/Confidence:* Medium impact (reduces React work); confidence medium-high because it focuses on the most egregious state updates.

2. **Consolidate reveal animations so `will-change` hints disappear once complete.**
   - *What to change:* After `RevealGroup`/`RevealItem` animations finish (e.g., using `animationend` or `prefers-reduced-motion`), remove `will-change` or set it to `auto` via a utility class instead of leaving it on permanently (`src/styles/site-theme.css:501-520`). Also consider trimming `filter: blur` on static content and reducing `mix-blend-mode` usage on `glint-sweep` overlays (`:1080-1130`).
   - *Why it helps:* Reduces the number of layers the compositor keeps alive, freeing GPU memory and decreasing paint time once the animation is not running.
   - *Where:* `src/styles/site-theme.css:501-520` and the components that re-use `RevealGroup`/`RevealItem` (home timeline, marquee, experience picker, booking options, shotguns sections).
   - *How to verify:* In DevTools’ Layers panel, the number of layers before/after the reveal should drop, and `Paint flashing` should exercise fewer pixels when scrolling. Check the “Compositing” section of the Performance trace for `Layout` vs `Paint` times post-animation.
   - *Impact/Confidence:* Medium impact for GPU paint budgets; confidence medium.

## Deep surgery

1. **Replace or downsample the fluid smoke entirely for a CSS/video-based effect.**
   - *What to change:* Reimplement the visual that `SectionRevealSmoke` provides using a pre-rendered video/PNG gradient that animates via CSS (`opacity`/`transform`) instead of WebGL, or at least run the simulation at a fixed 60 px grid and only render once per 200 ms. This removes the per-pointer shader pipeline while keeping the “smoke” motif.
   - *Why it helps:* Removes the heaviest GPU consumer (the custom shader with advection + pressure passes) and the pointer-driven `requestAnimationFrame` loop, so no GPU work happens when the CTA is idle.
   - *Where:* `src/components/ui/section-reveal/section-reveal-smoke.tsx` + `src/lib/fluid-smoke.ts`.
   - *How to verify:* Use DevTools Performance to search for `WebGL` activity while hovering a collapsed CTA—after the change, WebGL draw calls should disappear from the trace entirely, and GPU utilization should be near zero. Verify with the Layers panel that only CSS opacity/transform animations remain.
   - *Impact/Confidence:* High impact on GPU and battery; confidence low-medium because it is a larger visual refactor.

## Measurement plan

### Chrome DevTools Performance workflow
1. **Baseline capture:** Open the page (home, shotguns, or heritage) in Chrome, disable cache, optionally throttle CPU to 4×, and record a 6–8 s Performance trace that scrolls through the hero/timeline or carousel multiple times.
2. **What to look for:** In the “Summary”, note any `Long Tasks` (>50 ms) that coincide with scrolls, look at the “Activity” timeline for `Style`/`Layout`/`Paint` spikes, and watch the FPS graph for dips. Confirm that `Scroll` events and `Animation` frames (from `SectionBackdrop`/`ScrollIndicator`) dominate frame time. After each change, run the same trace and compare: aim for fewer long tasks, shorter layout/paint slices, and steadier FPS.
3. **After-action:** Export the trace or note the max FPS, total `Style/Layout/Paint` time, and WebGL/GPU busy time to feed into the baseline table below.

### Layers / Rendering / Paint flashing
1. In DevTools’ `Rendering` tab, enable “Show paint rectangles” and “Layer borders” while reproducing the scroll/hover sequences. Verify that fewer overlays/hints remain once `RevealGroup` animations end or after parallax is paused.
2. Check the `Layers` panel for the number of active layers before/after fixes. The goal is to remove the extra `will-change` layers representing `clip-path` masks and to reduce the `backdrop-filter` layers that cover the entire viewport.

### React Profiler workflow
1. Record a profiling session while interacting with the suspect components (e.g., scroll the Heritage era, scroll the PlatformGrid carousel, or toggle collapsed sections on the home/shotguns page).
2. Focus on `PlatformGridBody`, `HeritageEventRail`, and `HeroBanner`/`SectionRevealSmoke` to see render counts and “wasted” renders clipped to `setActiveIndex` or `setActiveEventIndex`.
3. After applying a fix, re-record and confirm that the render count drops, committed times shrink, and the “Flame graph” shows fewer updates during scroll.

### WebGL-specific checks
1. **Pixel ratio clamp:** In DevTools, monitor the WebGL canvas resolution (Network > Canvas) while forcing a high DPR (Device Mode). Confirm that `createFluidSmoke`’s `Math.min(devicePixelRatio, 2)` clamp (`src/lib/fluid-smoke.ts:73-76`) is respected—compare the `canvas` size before/after.
2. **Pause offscreen:** Switch to another tab or scroll the CTA off-screen and ensure the smoke simulation stops after the 5 s timeout (look for `cancelAnimationFrame` entries in the Performance trace). Add a check in DevTools to confirm no `WebGL` draws appear while the tab is hidden.
3. **Draw-call heuristics:** In the Performance trace, filter by `WebGL` or `canvas` events and count draw calls while hovering the CTA. After the fix, the number of draws per second should drop dramatically.
4. **Background tab throttling:** While the smoke section is open, switch to another tab and verify that throttling (via the 5 s stop or `document.hidden` guard) prevents GPU work; look for zero `WebGL` activity in the background trace.

### Baseline-to-after comparison template
| Metric | Before | After | Goal |
| --- | --- | --- | --- |
| FPS (scrolling hero/timeline) | e.g., 52 fps | | >55 fps |
| Layout + Paint time (ms) per scroll tick | e.g., 18 ms | | <12 ms |
| Number of `scroll`-linked layouts per second (PlatformGrid) | e.g., 120 | | <40 |
| WebGL draw calls when hovering CTA | e.g., 120/sec | | <10/sec or zero |
| React renders triggered by `setActiveIndex`/`setActiveEventIndex` | e.g., 18 | | <6 |
| `SectionBackdrop` rAF callbacks per second | e.g., 6 sections × 60fps | | Only active for visible sections |
