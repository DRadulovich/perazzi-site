Nice, this is exactly how my nerd-brain likes to work: master checklist, then chew through it.

Here’s a roadmap of task cards from zero → fully polished PerazziHeritageEras.
Each line is intentionally short so you can:
	•	Use this as a progress checklist, and
	•	Copy the relevant line into a new Codex prompt and say “Write the task card for #X”.

⸻

Phase 0 – Grounding & Types

0.1 – Confirm/define shared types & props
	•	Ensure HeritageEvent, HeritageEra, HeritageEraWithEvents, and PerazziHeritageErasProps exist in a shared types file and are imported cleanly into the component.

⸻

Phase 1 – Root Scaffold

1.1 – Create PerazziHeritageEras root component
	•	New file: src/components/heritage/PerazziHeritageEras.tsx
	•	"use client", accept eras: HeritageEraWithEvents[], render minimal layout (no animation yet).

1.2 – Add basic structure & refs
	•	Split into <HeritageTimelineHeader /> and <HeritageErasStack />.
	•	Set up React state: activeEraIndex, maybe activeEraProgress.
	•	Create ref map from era.id → DOM nodes in the stack (placeholders for now).

⸻

Phase 2 – Vertical Era Stack & Sticky Viewports

2.1 – Implement HeritageErasStack
	•	New file: HeritageErasStack.tsx.
	•	Vertical stack of placeholder HeritageEraSections with basic layout.
	•	Pass callbacks: onEraInView, onEraScrollProgress.

2.2 – Implement HeritageEraSection with sticky viewport
	•	New file: HeritageEraSection.tsx.
	•	Outer <section> with height based on events.length.
	•	Inner div with position: sticky; top: 0; height: 100vh.
	•	Use placeholder content inside pinned viewport.

2.3 – Add era background layer
	•	Add EraBackgroundLayer (background image + overlay tint) behind the sticky viewport.
	•	Use era.backgroundSrc + era.overlayColor.

⸻

Phase 3 – Horizontal Event Rail per Era

3.1 – Implement basic HeritageEventRail layout
	•	New file: HeritageEventRail.tsx.
	•	Horizontal flex row of HeritageEventSlide children; each slide full viewport width.
	•	No motion yet, just static horizontal layout inside the pinned viewport.

3.2 – Implement HeritageEventSlide presentation
	•	New file: HeritageEventSlide.tsx.
	•	Render title, date, summaryHtml, media, links.
	•	Responsive layout (desktop: two-column, mobile: stacked).
	•	Use a safe HTML render for summaryHtml.

3.3 – Wire Framer useScroll for each HeritageEraSection
	•	Add useScroll using the section ref to get scrollYProgress (0–1 per era).
	•	Use useTransform to map scrollYProgress to a horizontal x translation for HeritageEventRail.
	•	Ensure the horizontal distance matches (events.length - 1) * viewportWidth.

3.4 – Compute and report active event index
	•	In HeritageEraSection, derive activeEventIndex from scrollYProgress.
	•	(Optional) Add callback onActiveEventChange so the parent can track active event if needed.

⸻

Phase 4 – Era In-View Detection

4.1 – Implement in-view detection for eras
	•	Use Framer Motion’s viewport options or an IntersectionObserver to detect when an era is the primary one in view.
	•	Call onEraInView(index) to update activeEraIndex in the root.

4.2 – Report per-era scroll progress
	•	Use scrollYProgress to compute an “era progress” value.
	•	Call onEraScrollProgress(index, progress) so the root can derive activeEraProgress.

⸻

Phase 5 – Timeline Header Basics

5.1 – Implement HeritageTimelineHeader skeleton
	•	New file: HeritageTimelineHeader.tsx.
	•	Fixed at top; render era labels from eras.
	•	Accept props: eras, activeEraIndex, optional activeEraProgress, onEraClick.

5.2 – Active era highlighting
	•	Style active era label based on activeEraIndex.
	•	Make labels buttons/links with proper a11y.

5.3 – Scroll-to-era on click
	•	In root: handle onEraClick(eraId) by looking up the era’s section ref and calling scrollIntoView({ behavior: 'smooth' }) with offset if needed.
	•	Ensure the header and stack scroll sync correctly.

⸻

Phase 6 – Timeline Marker & Track Motion

6.1 – Add marker + track layout
	•	Inside HeritageTimelineHeader, add:
	•	A stationary marker element.
	•	A horizontal track (flex row) for labels.

6.2 – Bind marker position to active era/progress
	•	Use Framer Motion to animate marker x based on (activeEraIndex + activeEraProgress) / (eras.length - 1).
	•	Smooth transitions between eras.

6.3 – Optional header parallax
	•	Add subtle horizontal motion of the track itself in response to marker/active era (similar to the reference timeline, but simpler).

⸻

Phase 7 – Reduced Motion & Fallback Layout

7.1 – Implement prefers-reduced-motion detection
	•	Add hook or Framer utility to detect prefers-reduced-motion.
	•	Expose this value to PerazziHeritageEras children via context or props.

7.2 – Reduced-motion behavior for eras
	•	If reduced motion:
	•	Disable sticky + horizontal transform.
	•	Render events as a vertical list within each era section.
	•	Ensure HeritageEventSlide layout still feels elegant.

7.3 – Reduced-motion behavior for header
	•	If reduced motion:
	•	Marker either:
	•	Doesn’t animate (just active label highlight), or
	•	Jumps between positions instead of gliding.

⸻

Phase 8 – Styling, Theming, and Perazzi Feel

8.1 – Tailwind theming for backgrounds & overlays
	•	Tune background image treatments (gradients, tints) using overlayColor.
	•	Ensure text contrast is solid (light-on-dark / dark-on-light variants).

8.2 – Typography & spacing polish
	•	Apply Perazzi typography tokens (headings, body, small caps, etc.).
	•	Dial in spacing between eras, slides, and header.

8.3 – Responsive breakpoints
	•	Make sure everything works on:
	•	Mobile (no weird pinning bugs, vertical layout still elegant).
	•	Tablet.
	•	Desktop/large screens (cinematic layout, maybe wider slides).

⸻

Phase 9 – Animation Tuning & Microinteractions

9.1 – Slide-in/out easing & timing
	•	Adjust Framer motion curves for the event rail and slides (feel: smooth, filmic, not twitchy).
	•	Add subtle fade/scale for slides as they enter their “sweet spot”.

9.2 – Header microinteractions
	•	Small hover effects on era labels.
	•	Slight scaling of active era label.
	•	Gentle easing on marker transitions.

9.3 – Background parallax nuances
	•	Optional: subtle parallax on era background (e.g., slower y-translation than content).

⸻

Phase 10 – Accessibility & QA

10.1 – Semantic structure & headings
	•	Ensure each era has an <h2> and events have logical heading/section structure.
	•	Confirm screen reader order is intuitive.

10.2 – Keyboard navigation
	•	Tab through header labels and links inside slides.
	•	Confirm scroll-to-era works from keyboard activation.

10.3 – Edge cases & robustness
	•	Test:
	•	Single era.
	•	Era with 1 event.
	•	Era with many events.
	•	Very tall content in events.
	•	Confirm all layouts degrade gracefully.

⸻

Phase 11 – Integration & Final Polish

11.1 – Integrate into page template
	•	Mount PerazziHeritageEras in the target heritage page.
	•	Ensure it plays nicely with surrounding sections (hero, footer, etc.).

11.2 – Performance pass
	•	Check for unnecessary re-renders.
	•	Consider React.memo where helpful.
	•	Ensure images use Next <Image> with proper sizes.

11.3 – Final visual QA
	•	Cross-browser/screen testing.
	•	Tweak any last spacing/animation details to match Perazzi’s cinematic tone.

⸻

That’s the roadmap.

When you’re ready to start, you can say something like:

“Let’s generate the Codex task card for 3.3 – Wire Framer useScroll for each HeritageEraSection”

…and we’ll blow that single line up into a detailed, Codex-ready task card with file paths, acceptance criteria, and guardrails.