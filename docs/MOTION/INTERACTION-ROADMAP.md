Here’s the cleanest “director → builder → color grade” workflow I’d use to go from **zero implementation** → **fully polished V1**, using your canonical spec at:

`docs/MOTION/MotionSystemSpec-V1.md`

I’m going to describe this as **passes**. Each pass has (a) what you do, (b) which tool to use (GPT-5.2 vs Codex), and (c) a *prompt you can paste*.

---

## Pass 0 — Set yourself up so Codex can’t “lose the plot”

**Do this once, before any code changes.**

**You do**

1. Create a branch like: `feature/motion-system-v1`
2. Make sure the spec is committed on that branch.
3. Decide your “house rule”: *Codex must treat the spec as canonical; if ambiguous, infer the most consistent interpretation and note it.*

**Use**

* Codex CLI for implementation work
* GPT-5.2 Pro only for design reviews / tuning decisions

**Codex prompt (CLI)**

```md
Read `docs/MOTION/MotionSystemSpec-V1.md` and treat it as canonical.

Before making any code changes:
1) Summarize the spec into a short checklist you will follow during implementation.
2) Identify the 12 target components and list their likely triggers and role mappings at a high level.
3) Propose a pass plan that matches the spec’s three layers (Tokens → Variant Factories → Director Mode).
Do NOT implement yet.
```

This creates a shared “mental contract” inside the session.

---

## Pass 1 — Repo reconnaissance + classification (Variant vs Director)

**Goal:** Decide which components are “standard variant factory” and which are “director mode” candidates.

**You do**

* Let Codex scan the 12 files and your existing motion setup (Framer Motion usage, existing motion config files, CSS tokens, etc).

**Use**

* Codex CLI (because it can grep and inventory quickly)

**Codex prompt**

```md
Scan the repo for existing motion infrastructure (configs, utilities, Framer Motion usage, motion-related CSS).

For each of the 12 target components:
- Identify current interaction triggers (hover/click/focus/in-view/scroll/selection changes).
- Propose role slot mapping (environment/surface/primary/structure/items/detail).
- Recommend: Variant Factory (default) vs Director Mode (only if truly needed), with 1–2 sentence justification.

Output a table + a recommended integration order (start with 2–3 “representative” components).
Do NOT implement yet.
```

**Why this matters:** you avoid building a scene engine for everything when only 2–3 sections need it.

---

## Pass 2 — Implement Layer 0: Motion Tokens + Knobs (no component changes yet)

**Goal:** Create the centralized knobs and token source of truth first, so everything else plugs into it.

**You do**

* Tell Codex to implement *only* the global token layer + reduced-motion plumbing.

**Use**

* Codex CLI

**Codex prompt**

```md
Implement Layer 0 from `docs/MOTION/MotionSystemSpec-V1.md`:
- Create a centralized motion token/knob source of truth (tempo, luxuryEnter, snapExit, staggerDensity, staggerCap, travel, focusDepth, settle, accentLevel).
- Include a way to read `prefers-reduced-motion` and expose it to the system.
- Keep implementation minimal and clean; do not modify the 12 components yet.
- Add lightweight documentation near the code explaining how to consume the tokens.

After implementing, run the repo’s standard lint/build/tests (ask me before running commands that require approval).
```

**Deliverable after this pass:** a stable “control panel” for the entire motion language.

---

## Pass 3 — Implement Layer 1: Motion Kit + Variant Factories (still minimal component changes)

**Goal:** Build the reusable “engine” that expresses the stage grammar + roles + stagger presets.

**You do**

* Have Codex create:

  * the role vocabulary
  * the stage grammar (Reframe → Establish → Primary → Structure → Secondary → Finish)
  * the reverse rule set (snappy cut, not rewind)
  * the stagger preset library + stagger caps
  * reduced-motion behavior (“premium static editing”)

**Use**

* Codex CLI

**Codex prompt**

```md
Implement Layer 1 (Variant Factories) from `docs/MOTION/MotionSystemSpec-V1.md`:
- Define the shared roles: environment/surface/primary/structure/items/detail.
- Implement the canonical stage grammar for forward (pull focus) and reverse (director’s cut).
- Implement stagger presets + enforce `staggerCap` and “visible-first” behavior where possible.
- Implement reduced-motion behavior per spec (no travel/settle/stagger; premium static emphasis).
- Provide a simple API for components to opt in (role mapping + state idle/active + chosen stagger preset).
Do not convert all 12 components yet.

Then: convert ONLY 1 representative component as an end-to-end example.
```

**Pick the representative component:** something medium-complex but not the hardest (often `PlatformGrid` or `ExperiencePicker` is perfect).

---

## Pass 4 — “Taste pass” on the system (before rolling to all 12)

This is where you keep it from becoming “technically correct, emotionally mid.”

**You do**

* Open the representative component in VS Code
* Run it locally
* Observe feel: pacing, overlap, settle, reverse speed, stagger density

**Use**

* GPT-5.2 Pro (design/taste feedback)
* Codex (to apply tweaks)

**Your GPT-5.2 Pro prompt**

```md
Here is `docs/MOTION/MotionSystemSpec-V1.md`. Here is the implementation summary/diff for the motion tokens + motion kit + the first converted component (pasted below).

Do a taste-and-systems critique:
- Does this match the Lens-Focus thesis?
- Is the hierarchy clear: environment → surface → primary → structure → details → finish?
- Is reverse a clean cut and faster than forward?
- Are the knobs sufficient and high leverage?
- Where does it feel generic or too loud?

Give me a prioritized list of tweaks (max 10) that preserve the spec but improve “expensive restraint.”
Do NOT write code.
```

Then you feed the top 3–5 tweaks back to Codex.

---

## Pass 5 — Convert the remaining 11 components (in controlled batches)

**Goal:** Avoid the “12 snowflakes” failure mode by converting in batches and stabilizing.

**You do**

* Convert in **3 batches**:

  * Batch 1: “standard sections” (variant factories)
  * Batch 2: “list/grid heavy” (stagger cap validation)
  * Batch 3: “flagships” (possible Director Mode)

**Use**

* Codex CLI for batch conversions

**Codex prompt template (repeat per batch)**

```md
Convert the following components to the Motion System V1:
[PASTE 3–5 FILE PATHS]

Rules:
- Treat `docs/MOTION/MotionSystemSpec-V1.md` as canonical.
- Use the shared roles + stage grammar + global knobs.
- Keep motion language consistent: do not invent new bespoke choreography.
- Ensure reverse is snappy and interruption-friendly.
- Enforce stagger caps and avoid rerunning full section choreography on high-frequency state changes.

After converting, run lint/build/tests and summarize any issues + fixes.
```

---

## Pass 6 — Implement Layer 2: Director Mode only where justified

**Goal:** Add explicit beat sequencing + interruption policies *only* for the sections that truly need it.

**Use**

* Codex CLI

**Codex prompt**

```md
Implement Layer 2 “Director Mode” utilities per `docs/MOTION/MotionSystemSpec-V1.md`, but ONLY apply it to the components we previously classified as needing it.

Requirements:
- Same roles, same tokens/knobs, same stage grammar.
- Explicit beat sequencing with offsets/overlaps.
- Interruption policy: rapid toggles must always land cleanly.
- Optional scroll coupling only if it materially improves the flagship section (and still respects reduced motion).

After implementing, ensure the rest of the components remain on Variant Factories unchanged.
```

---

## Pass 7 — Final polish: performance + reduced motion + consistency audit

**Goal:** Make it shippable.

**You do**

* Run through:

  * normal mode
  * reduced motion
  * keyboard navigation/focus
  * rapid toggles (spam click, hover in/out)
  * heavy lists (stagger cap working)

**Use**

* Codex CLI for fixes
* GPT-5.2 Pro for final “taste audit” (optional but powerful)

**GPT-5.2 Pro prompt**

```md
Using `docs/MOTION/MotionSystemSpec-V1.md` as the rubric, audit the final system based on:
- Consistency across all 12 components
- Forward hierarchy clarity
- Reverse “director’s cut” quality
- Reduced-motion premium behavior
- Risk areas for jank or motion spam

Give me a punchlist of final polish changes (prioritized).
No code.
```

---

## The key meta-rule that makes this work

**Don’t ask Codex to “implement everything” in one mega-pass.**
Ask it to implement the **system first**, then convert **one** component, do a taste pass, then roll out in batches. That’s how you get “world-class” instead of “technically impressive wreckage.”

If you follow the passes above, you’ll end with:

* a centralized knobbed motion system
* consistent role/stage grammar everywhere
* director-grade sequencing only where it actually earns its complexity
* a real final polish loop (the part most people skip)

That’s the shortest path to the “expensive” feel you’re after.






# Animation Choreography Proposal (plan only)

`shared/animation/plan.md`
- Create a shared “choreo” toolkit (no new deps): tokens for durations (short 180ms, base 320ms, long 520ms), stagger (70–110ms), easing (cubic-bezier(0.22,1,0.36,1)), and a `reduceMotion` guard.
- Add reusable primitives: `choreoFadeLift`, `choreoSlide`, `choreoScaleParallax`, `choreoMaskWipe` (clip/gradient reveal) and a `ChoreoGroup` helper that wraps `RevealGroup`/`RevealItem` to auto-apply stagger and state classes.
- Support swap animations for data changes (list selection, tab change) via keyed `presence` classes instead of remounting DOM; exit: fade/down 8px over 180ms, enter: fade/up 12px over 260ms.
- Keep scroll/pinned sections GPU-friendly: translate/opacity only; avoid layout thrash by pre-measuring (`useRevealHeight`) and running animation via CSS vars set on mount.

`src/components/home/timeline-scroller.tsx`
- Section entrance: backdrop parallax fade, then collapsed header lifts in; when expanded, heading + eyebrow + instructions cascade.
- Pinned layout: stage list buttons cascade (Stage 1→N), active pill pulses softly; stage panel uses mask-wipe on image, then stage meta (label, title, body, caption) staggered; CTA button slides up last.
- Stacked layout: each accordion card lifts on reveal; inner `TimelineItem` content cascades (image -> title -> copy). Active/collapse transitions crossfade with 8px slide.
- On stage change (pinned): crossfade/slide between panels with subtle zoom-out of previous, zoom-in of next; maintain scrim overlay fade synced to image.

`src/components/home/marquee-feature.tsx`
- Entrance: portrait scales from 1.04→1.0 with fade; eyebrow, name, subtitle, quote, CTA cascade.
- Title-reveal expand: collapsed header lifts; expand animates shell height smoothly, then content group staggers.
- Optional article link arrow glides right on hover with trailing underline animation.

`src/components/shotguns/PlatformGrid.tsx`
- Header: heading + subtitle slide up; collapse/expand crossfade.
- Tabs: pill buttons slide in with 60ms stagger; active underline animates left→right on selection.
- Mobile carousel: each card enters with slide-in from right and fade; on scroll/selection, champion highlight crossfades with slight parallax on avatar.
- Desktop grid: card image mask-wipe, then meta/CTA cascade; champion highlight fades/zooms with text stagger.

`src/components/shotguns/DisciplineRail.tsx`
- Category list: category cards slide down sequentially; expanding a category runs a height animation with staggered discipline pills.
- Detail card: hero image mask-wipe, heading lift, body prose fade, recommended platform pills cascade, model buttons scale/fade individually.
- Modal: overlay fades, content scales from 0.98→1 with opacity; detail grid items stagger horizontally.

`src/components/shotguns/TriggerExplainer.tsx`
- Collapsible header: title/subtitle lift; mobile trigger button pulses on hover.
- Content: copy block fades/lifts, link chips slide in from left with 50ms stagger; diagram card uses mask-wipe + gradient reveal, caption fades in last.
- Manual open/close: height animation plus entry/exit of content with controlled opacity/translate.

`src/components/shotguns/EngravingGradesCarousel.tsx`
- Category accordion: cards slide down; grade pills cascade; active pill underlay grows.
- Grade card: hero image mask-wipe; “Engraving Grade” label, name, description, CTA staggered; CTA underline animates on hover.
- Category change: fade/slide swap of grade card with short exit/enter timings.

`src/components/bespoke/BuildStepsScroller.tsx`
- Section intro: heading/subheading/instructions cascade; anchor buttons slide in from sides.
- Rail nav (desktop): pills sweep in; active indicator animates width/position.
- Each step panel: background image parallax-fade on entry; card lifts with mask-wipe; title, read-more toggle, body, CTA/dots cascade. Mobile dots fade/scale.
- Scroll-activated step change: apply subtle crossfade + y-offset reset so the active card feels pinned while backgrounds swap.

`src/components/experience/ExperiencePicker.tsx`
- Grid cards cascade row-by-row: image mask-wipe, micro-label, title, summary, CTA arrow.
- FAQ block: heading and lead lift, then questions list items fade/slide with short stagger.

`src/components/experience/VisitFactory.tsx`
- Left column: labels/heading/address fade-lift; map panel mask-wipe + scrim fade; “Open in Maps” slides right.
- Right column: “What to expect” collapsible height animation; caret rotates; body copy fades. CTA button scales from 0.98→1 with shadow bloom.

`src/components/experience/BookingOptions.tsx`
- Options grid: cards stagger with lift; inside each, title/duration/copy/CTA cascade.
- Scheduler card: header + button enter together; on toggle, panel height animates and iframe fades in; fallback skeleton fades out when iframe loads.

`src/components/experience/TravelNetwork.tsx`
- Header cascade; tab pills slide in with active underlay animation.
- Tab switch choreography: fade/slide old list out 80px up, new list in from 24px down. Cards within list stagger.
- Schedule cards: date, title, location stagger; dealers: name, state, address stagger.

`src/components/heritage/ChampionsGallery.tsx`
- Filters: pill buttons slide in; active pill underlay animates.
- Champion list: names cascade; active item background grows; on selection, detail pane swaps with fade/slide and image mask-wipe.
- Detail content stagger: hero image, name, highlights list, bio, quote, discipline/platform pills, CTA.

# Implementation order
1) Build shared choreo tokens/helpers (ensure reduced-motion support).
2) Apply to home sections (timeline, marquee) to validate patterns.
3) Shotguns sections (grid, discipline, trigger, engraving) with selection/tabs handling.
4) Bespoke and experience flows.
5) Heritage gallery.
