# Motion System Spec V1 — Lens-Focus Stage Engine (Canonical)

**Status:** Canonical spec for implementation (V1)  
**Audience:** Codex (implementation), humans (review/tuning)  
**Scope:** One cohesive “choreographed state transition” motion language across 12 components.  
**Non-goal:** This document does **not** prescribe exact code, libraries, or file paths; it defines **behavior, structure, and constraints**. Implementation should adapt to the repo’s existing motion stack (Framer Motion/CSS/WAAPI/etc.) while honoring this spec.

---

## 0) Intent and Quality Bar

### What we are building
A unified motion system that makes the site feel **cinematic, premium, and intentionally staged**—like editorial pacing and camera work, not generic UI animation.

### “Awwwards-level” definition (explicit)
This means “top-tier web experience craftsmanship,” characterized by:
- **Visual craft:** refined hierarchy, spacing, and composition; no template feel.
- **Motion as storytelling:** staging that guides attention and clarifies structure.
- **Taste + restraint:** rich micro-detail that never becomes chaotic or distracting.
- **Interaction clarity:** states are readable and purposeful; motion reinforces meaning.
- **Performance polish:** smooth and confident; no jank; feels “native.”
- **System cohesion:** one motion language across all sections; not 12 unrelated animations.

---

## 1) Targets (12 Components)

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

---

## 2) Motion Thesis (Lens-Focus)

Motion should feel like **a camera finding the subject**:
- The environment subtly **quiets/reframes** to create focus.
- The main “surface” resolves into clarity with a confident establishing move.
- Primary information appears first; structure and details follow in composed waves.
- A tiny finishing “settle” communicates precision.
- Reverse is a **clean cut**, not a rewind.

This is the single shared grammar across all 12 sections.

---

## 3) Canonical State Model

### States
- **`idle`** (resting/non-interacted)
- **`active`** (interacted/engaged/expanded/selected)

### Transitions
- **Forward:** `idle → active` (luxurious, staged)
- **Reverse:** `active → idle` (snappy, interruption-friendly; not a rewind)

### Triggers (component-specific, but mapped to the same state model)
Each component can enter `active` via one or more triggers:
- click/tap
- focus/keyboard navigation
- hover (if used, must be intentional; no accidental hover spam)
- in-view/scroll reveal
- selection changes within a component (tabs/steps/carousel)
- scroll progress binding (only for flagship components; see Director Mode)

**Rule:** Regardless of trigger type, the *motion language stays the same*.

---

## 4) Canonical Choreography Grammar

### Forward (idle → active): “Pull Focus”
Forward choreography is always staged in this order:

**Stage 1 — Reframe (Environment quiets)**
- Subtle scrim/gradient/vignette shift to “quiet” the surroundings.
- This communicates: “this section is now the subject.”

**Stage 2 — Establish (Surface resolves)**
- Primary container/surface gains presence via controlled lift/scale/clarity.
- This is the “expensive” moment: confident, minimal, deliberate.

**Stage 3 — Primary (Hero beat)**
- Headline/key visual/primary element resolves first with the most intentional timing.

**Stage 4 — Structure (Controls beat)**
- Tabs/rails/navigation/structural UI elements land into their active posture.
- Must improve readability and structure, not distract.

**Stage 5 — Secondary (Details resolve in waves)**
- Items reveal in a patterned stagger appropriate to the component type:
  - grids: diagonal or directional sweep
  - galleries: center-out or focal-first
  - scrollers: rhythmic ticks/beats
  - carousels: stack-to-front or left-to-right beats
- **Must cap stagger** to avoid long tails and chaos (see Performance Rules).

**Stage 6 — Finish (Micro-settle + optional accents)**
- Tiny finishing correction communicates precision.
- Optional accents (CTA glint/indicator spring) can occur **only here** and must remain subtle.

### Reverse (active → idle): “Director’s Cut”
Reverse transition is never a full backward replay.

**Rules for reverse:**
- Skip Stage 1 (no establishing on exit).
- Skip Stage 6 (no settle on exit).
- Compress exit into a clean cue:
  1) details tuck (opacity first, then travel)
  2) surface retracts
  3) environment returns quickly
- Must be **faster than forward** and interruption-friendly.

---

## 5) Shared Roles (Slots) — Required Abstraction

Each component must map key elements into a shared set of roles. Not all roles must be present, but the role vocabulary is consistent.

### Roles
- **`environment`**: background influence layers (scrim/gradient/vignette/ink wash)
- **`surface`**: main container/panel/surface for the section
- **`primary`**: headline/key visual/primary focus element
- **`structure`**: controls/navigation/rails/tabs/stepper UI
- **`items`**: repeated elements (cards, list items, grid cells, thumbnails)
- **`detail`**: micro UI elements (badges, small indicators, CTA accents)

**Rule:** Motion is authored against roles, not bespoke DOM structure. This is how we keep 12 components coherent.

---

## 6) System Architecture (Three Layers)

This system intentionally combines the best parts of all approaches:

### Layer 0 — Motion Tokens (Design-System Discipline)
A centralized definition of motion constants that unifies everything:
- durations (enter/exit/settle)
- easing set (forward vs reverse)
- stagger density + caps
- travel amplitude
- focus depth (environment quieting strength)
- accent allowance/intensity

Tokens can be represented as:
- CSS variables + state attributes **and/or**
- a JS config module
Implementation must choose an approach that fits the repo, but tokens must remain centralized and consistent.

### Layer 1 — Variant Factories (Default for Most Components)
Reusable choreography “recipes” that implement the stage grammar using shared roles:
- section shell reveal (environment + surface + primary + structure)
- stagger patterns for items (grid diagonal, center-out, rhythmic, stack, etc.)
- internal content swap preset (for tab/step changes without rerunning full section entry)

Most of the 12 components should be implemented using variant factories + tokens + role mapping.

### Layer 2 — Scene Director Mode (For Flagship Sections Only)
A director-grade sequencing mode for components that truly need explicit beat control and interruption logic:
- explicit beat sequencing (Stage 1–6 as named beats with offsets/overlaps)
- interruption policy: cancel/blend/snap-to-clean-end
- optional scroll-progress binding for certain beats
- strict adherence to the same tokens and roles

**Director Mode should be used sparingly** (likely candidates):
- `timeline-scroller.tsx`
- `BuildStepsScroller.tsx`
- `TravelNetwork.tsx`
- potentially complex carousels (if needed)

**Rule:** Even in Director Mode, the **grammar and tokens remain the same**.

---

## 7) Central Knobs (Global Controls)

Expose a small set of high-leverage dials. These must be centralized and shared by all 12 sections.

### Required knobs
- **`tempo`**: global multiplier for timing
- **`luxuryEnter`**: increases overlap + slightly longer forward pacing
- **`snapExit`**: compresses exit timing + uses snappier easing
- **`staggerDensity`**: spacing/timing between item reveals
- **`staggerCap`**: maximum number of items that will stagger on any single reveal
- **`travel`**: amplitude of translation/scale (tasteful; not flashy)
- **`focusDepth`**: strength of environment quieting (scrim/vignette intensity)
- **`settle`**: micro-settle amount (very small; can be disabled globally)
- **`accentLevel`**: whether accents are allowed and how subtle they are

**Rule:** Everything else should be expressed as presets built from these knobs.

---

## 8) Stagger Presets (Pattern Library)

Define a small set of stagger patterns reusable across components. Each component selects one (or two at most).

### Recommended preset set
- **`diagonalSweep`**: for grids (PlatformGrid)
- **`leftToRightBeats`**: for card rows/carousels
- **`centerOut`**: for galleries (ChampionsGallery)
- **`rhythmicTicks`**: for scrollers/timelines (TimelineScroller/BuildSteps)
- **`stackToFront`**: for carousel-like stacks (EngravingGradesCarousel)
- **`clusterReveal`**: for grouped UI (BookingOptions/ExperiencePicker)

**Rules:**
- Stagger applies to **first N visible/important items** only (use `staggerCap`).
- Stagger must not rerun excessively due to high-frequency state changes.

---

## 9) Performance and Stability Rules (Non-Negotiables)

### Performance goals
- Must feel smooth and confident (target “feels 60fps”).
- Avoid layout thrash and accidental reflow churn.
- Avoid long-tail stagger sequences that feel sluggish.

### Default-safe properties
- Prefer compositor-friendly transitions (typically transforms + opacity).
- Any heavier effects must be layered and controlled.

### Heavy effects policy (Luxury Overlays)
- Blur/backdrop/filter effects are allowed only if:
  - used as overlays
  - opacity is animated (not the filter itself, or not aggressively)
  - intensity is capped and optional via knobs/tokens

### Layout thrash avoidance
- Do not rely on animating layout-driven properties (height/width/top/left) for the main choreography.
- If measurement is needed, do it once per scene/transition, then animate transforms.

### Stagger cap requirement
- Never animate “all items” in a big list/grid.
- Always cap and/or restrict to visible elements.

### Rerun prevention for scrollers/timelines
For TimelineScroller/BuildSteps/etc.:
- Do not rerun full section entry choreography on every internal step.
- Use a separate “content swap” preset for internal transitions.

---

## 10) Reduced Motion (Premium Static Editing)

Reduced motion must still feel premium, not “disabled.”

### Requirements
- Respect `prefers-reduced-motion: reduce`.
- Maintain the same state model and hierarchy, but remove travel/settle and remove stagger.
- Use “cuts” and short dissolves only if necessary for clarity.
- Communicate hierarchy through:
  - contrast/opacity normalization
  - typography emphasis (weight/size/spacing)
  - borders/underlines
  - subtle background state changes

**Rule:** Reduced motion mode is a deliberate alternate art direction, not a degraded fallback.

---

## 11) Component Integration Guidelines (How Each Section Opts In)

Each of the 12 components should be integrated via the same conceptual steps:

1) Identify trigger(s) and map to shared state (`idle | active`).
2) Map DOM sub-elements into shared roles (environment/surface/primary/structure/items/detail).
3) Apply the stage grammar via:
   - Variant Factory (default) **or**
   - Director Mode (flagship-only)
4) Choose a single stagger preset and apply `staggerCap`.
5) Ensure reverse is snappy and interruption-friendly.

**Rule:** The motion language must feel like one system even if internals differ.

---

## 12) Acceptance Criteria (Definition of Done)

A build meets V1 when:

### Cohesion
- All 12 sections clearly share the same stage grammar and role vocabulary.
- Motion feels like one designed system, not a patchwork.

### Forward quality
- Forward has recognizable staged hierarchy: environment → surface → primary → structure → details → finish.
- Details reveal feels patterned and intentional, not random.

### Reverse quality
- Reverse is faster than forward and feels like a clean cut.
- Reverse does not “rewind the movie.”
- Rapid toggles and interruptions land cleanly.

### Performance
- No obvious jank, layout thrash, or long-tail stutter.
- Stagger is capped; large lists remain stable.

### Accessibility
- Reduced-motion behavior is implemented and still premium.
- Keyboard/focus triggers behave sanely where relevant.

### Tunability
- Global knobs exist and affect all sections consistently.
- There is a clear way to make motion “more subtle” or “more dramatic” via centralized knobs, not per-component hacks.

---

## 13) Implementation Notes (Guardrails for Codex)

- Treat this document as canonical. If any repo reality conflicts, adapt implementation **without violating behavior**.
- Prefer shared utilities and presets over bespoke per-component logic.
- Keep “Director Mode” limited to sections that truly require explicit sequencing or scroll binding.
- Document the final knobs and presets in a brief “Motion System Overview” note (short, human-readable) alongside the implementation.

---

## 14) Recommended Output Artifacts (for the repo)

When implemented, the repo should contain:
- A centralized motion token definition (CSS variables and/or JS config)
- A small set of variant factories (“motion kit”)
- Optional director-mode scene sequencing utilities (only if needed)
- A brief overview doc describing:
  - stage grammar
  - roles
  - knobs
  - which components use director mode vs variants

(Exact file paths are implementation-dependent.)

---

## 15) V1 Philosophy (Do Not Drift)

**Richness comes from hierarchy + staging + micro-detail… not animating everything.**  
If a choice must be made, prioritize:
- clarity over spectacle
- coherence over bespoke cleverness
- smoothness over complexity
- premium restraint over motion spam