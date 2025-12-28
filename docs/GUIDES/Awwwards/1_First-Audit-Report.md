## 1) Repo Recon Summary (Pass 0 + Pass 1)

- **Brand/design references found (Pass 0):**
  - UI contract + DS levers + system map: `docs/ui-style-contract.md:1`, `docs/SITE-ARCHITECTURE/site-visual-levers.md:1`, `docs/SITE-ARCHITECTURE/site-style-system-map.md:1`
  - Stack + experience intent (“cinematic, scroll-led”): `docs/SITE-ARCHITECTURE/perazzi-site-dossier.md:1`
- **Stack evidence (constraint check):** Next.js App Router + Tailwind v4 + Framer Motion present in `package.json:1`.

### Global layout + shell
- Root theming + font vars live in `src/app/layout.tsx:1` (Geist Sans/Mono + Cedarville Cursive loaded).
- Site runtime wrapper is `src/app/(site)/layout.tsx:1` + `src/app/providers.tsx:1` (ThemeProvider + next-intl).
- Primary shell is `src/components/site-shell.tsx:1` (sticky header, footer, optional chat widget).
- Primary nav is `src/components/primary-nav.tsx:1` (sticky, “brand vs transparent” variants; flyouts).

### Design tokens / theme files
- Canonical tokens live in `src/app/globals.css:1`:
  - Perazzi palette: `--perazzi-red/black/white`
  - Surfaces/ink/border tokens + scrims + focus ring
  - Tailwind v4 `@theme inline` binds token names to utilities
  - Premium radii/shadows and semantic helpers
- Chat has legacy token duplication in `src/app/chat.css:1`.
- Motion constants exist but are narrow: `src/lib/motionConfig.ts:1`.

### Typography usage (what’s *actually* happening)
- Typography primitives exist:
  - Heading: `src/components/ui/heading.tsx:1`
  - Text: `src/components/ui/text.tsx:1`
  - Page heading composition: `src/components/page-heading.tsx:1`
- But many hero/feature modules are bespoke:
  - Home hero: `src/components/home/hero-banner.tsx:1`
  - Heritage hero: `src/components/heritage/HeritageHero.tsx:1`
  - Service hero: `src/components/service/ServiceHero.tsx:1`
  - Bespoke hero: `src/components/bespoke/BuildHero.tsx:1`
  - Concierge hero: `src/components/concierge/ConciergeHero.tsx:1`
- System-wide pattern today: **micro uppercase + heavy tracking + frequent italic + heavy weights** (often applied beyond eyebrows/metadata).
- Long-form typography uses `.prose` (tokenized) in `src/app/globals.css:1`, with journal body rendering in `src/components/journal/PortableBody.tsx:1`.

### Motion usage (Framer Motion, scroll, transitions)
- Framer Motion is used across hero/scroll choreography:
  - Home hero parallax + manifesto overlay: `src/components/home/hero-banner.tsx:1`
  - Pinned craft timeline: `src/components/home/timeline-scroller.tsx:1`
  - Heritage hero parallax: `src/components/heritage/HeritageHero.tsx:1`
  - Heritage eras scrollytelling (sticky chapters + reduced-motion branch): `src/components/heritage/HeritageEraSection.tsx:1`, `src/components/heritage/PerazziHeritageEras.tsx:1`, `src/hooks/usePrefersReducedMotion.ts:1`
- UI overlays follow a documented standard:
  - Dialog primitive: `src/components/ui/dialog.tsx:1`
  - Contract description: `docs/ui-style-contract.md:1`
- Reduced-motion handling exists via:
  - Framer’s `useReducedMotion` (per-component; many files)
  - Custom hook `usePrefersReducedMotion` used in Heritage eras: `src/hooks/usePrefersReducedMotion.ts:1`

### Key experiences/pages (structure evidence)
- Home: `src/app/(site)/page.tsx:1` (hero → craft timeline → guide → marquee → finale)
- Heritage: `src/app/(site)/heritage/page.tsx:1` (hero → intro → eras timeline → galleries/lookup)
- Shotguns: `src/app/(site)/shotguns/page.tsx:1` (editorial framing + grids/rails + CTAs)
- Concierge: `src/app/(site)/concierge/page.tsx:1` + build planner shell `src/components/concierge/ConciergePageShell.tsx:1`
- Build long-form “soul” journey: `src/app/(site)/the-build/why-a-perazzi-has-a-soul/BuildJourneyClient.tsx:1`
- Chat rail: `src/components/chat/ChatWidget.tsx:1`, `src/components/chat/ChatPanel.tsx:1`

---

## Visual language map (what the site currently *is*)
- **It’s already “cinematic + glass + editorial.”** Full-bleed imagery, scrims, blur-glass cards, narrative copy, and reduced-motion paths strongly support Perazzi’s ethos.
- **Where it’s strongest (ethos-aligned):** contemplative pacing, reverence, lineage storytelling, reduced-motion branches, restrained palette with Perazzi red as accent (e.g. Home manifesto language in `src/components/home/hero-banner.tsx:1`).
- **Where it drifts / fights itself:**
  - Typography loudness + inconsistency (uppercase/italic/tracking is everywhere, not just metadata).
  - Token coherence gaps (mixed “brand red” naming; missing semantic utilities noted in `docs/SITE-ARCHITECTURE/site-style-system-map.md:1`).
  - Motion coherence gaps (some easing/timing is bespoke per component; repeated “fade+lift” risks template vibes if scaled indiscriminately).

---

## 2) Awwwards-grade Direction Proposals (3 systems)

## Direction 1 — Quiet Monument Editorial

### A) Typography System
**Thesis:** Sentence-case serif headlines + disciplined micro-labels: the site reads like a private archive, not a campaign.

- **Type scale strategy:** 6 levels (Display / H1 / H2 / H3 / Body / Small+Caption), responsive step-ups at `sm` and `lg` only.
- **Hierarchy rules:**
  - **Eyebrow:** micro uppercase, tracked, short (chapter marker only).
  - **Headlines:** serif, sentence case; tracking tight/neutral; weights moderate.
  - **Subheads:** sans, calm, clarity-first.
  - **Captions/quotes:** italic becomes meaningful again (captions, pull quotes, artisan voice moments).
- **Rhythm rules:** body targets 60–75ch; generous leading; bigger spacing between “chapters” than between UI blocks.
- **Key component treatments:**
  - **Hero headlines:** serif identity statements (1 breath, 2 lines max), never all-caps.
  - **Section intros:** eyebrow → headline → short lead (editorial deck cadence).
  - **Specs/comparisons:** humane clarity: sans + tabular/mono for measurements only; hairline dividers; avoid “cold catalog.”
  - **Long-form story:** `.prose` becomes “film pacing”: intentional paragraph cadence + selective pull quotes.
  - **Assistant UI copy:** calm authority; fewer uppercase CTAs; micro labels only for system states.
- **Avoid:** long all-caps headlines, universal italics, excessive tracking on full sentences, decorative “luxury” clichés.

### B) Motion System — Breath & Gravity
**Thesis:** Motion behaves like a camera operator: subtle dolly, slow settle, long stillness.

- **Timing + easing philosophy:** two gears only—**cinematic (slow settle)** for chapter moments; **UI (quick ease-out)** for controls.
- **Motion primitives (conceptual):**
  - **Breath reveal:** soft opacity + tiny upward settle.
  - **Settle:** gentle weight landing for overlays/panels (micro-scale + fade).
  - **Glide:** restrained parallax for full-bleed imagery (story-earned only).
- **Entrance/exit patterns:** animate chapter boundaries (hero, section headers, one key card); keep most content still (silence is luxury).
- **Scroll choreography:** reserve pinning/parallax primarily for Heritage + Build; Home keeps a single signature sequence (already timeline-heavy).
- **Micro-interactions:** precision hover/underline travel; 1–2px lift max; assistant “thinking” feels like quiet instrumentation, not app UI.
- **Accessibility (`prefers-reduced-motion`):**
  - Disable parallax + sticky scrollytelling; present static chapter stacks (Heritage already models this).
  - Keep state changes legible via opacity/color, not movement.

### C) Fit & Tradeoffs
- **Ethos fit:** quiet confidence (stillness), transformation (editorial pacing), sacred craft (archive tone), legacy (chaptering), narrative (camera-like motion).
- **Best pages:** Home, Heritage, Journal, The Build; also elevates Shotguns without turning it into a catalog.
- **Risks:** requires discipline to reduce global uppercase/italic habits; serif must be truly intentional (loaded and used coherently).
- **Effort:** Medium.

---

## Direction 2 — Atelier Ledger (Modern Precision)

### A) Typography System
**Thesis:** Geist-led clarity with controlled heritage accents—the UI feels like a master’s notebook, not a boutique.

- **Type scale strategy:** 5 levels; fewer expressive variants.
- **Hierarchy rules:** sentence-case headings; mono/tabular for specs; micro labels mostly for navigation + metadata.
- **Rhythm rules:** shorter line lengths on technical pages; consistent vertical cadence across cards/tables.
- **Key component treatments:**
  - **Hero:** serif only for one key line (or none), keep everything else disciplined.
  - **Specs/comparisons:** mono/tabular numbers become hero; use whitespace + rules for legibility.
  - **Assistant UI:** tool-like calm; clearer system/state language; less theatrical styling.
- **Avoid:** decorative serif in dense UI, editorial italics everywhere.

### B) Motion System — Precision Mechanism
**Thesis:** Motion is engineered: short, consistent, tactile.

- **Timing + easing:** quick ease-out default; spring only for toggles/knobs.
- **Motion primitives:** click-settle, rail-slide, focus-sweep.
- **Scroll approach:** minimal parallax; pinning only where it already exists and clearly earns value.
- **Accessibility:** reduced motion ≈ identical experience (color/opacity emphasis).

### C) Fit & Tradeoffs
- **Ethos fit:** craft as discipline; quiet confidence via restraint and clarity.
- **Best pages:** Shotguns, Concierge, Service, Experience.
- **Risks:** could underplay rite-of-passage energy if taken too far; needs one signature moment per page to keep narrative alive.
- **Effort:** Small–Medium.

---

## Direction 3 — Rite of Passage (Chapter Film)

### A) Typography System
**Thesis:** The site becomes a sequence of chapters—identity first, information second.

- **Type scale strategy:** includes a “Chapter” layer (01/02/03) + larger display tier.
- **Hierarchy rules:** chapter labels + serif titles + quiet decks; artisan script is a rare signature (once per story).
- **Rhythm rules:** larger whitespace, shorter paragraphs, deliberate pauses.

### B) Motion System — Chapter Cuts
**Thesis:** Transitions feel like film edits: cutaways, crossfades, controlled reveals.

- **Motion primitives:** cutaway, fade-to-scrim, dolly-in (used sparingly).
- **Scroll choreography:** more structured beats in Heritage/Build/Journal; Home becomes chaptered.
- **Accessibility:** reduced motion replaces “film edits” with anchor jumps + static stacks; no sticky/pin.

### C) Fit & Tradeoffs
- **Ethos fit:** strongest for transformation + narrative over visibility.
- **Best pages:** Heritage, The Build, Journal.
- **Risks:** higher complexity/perf risk if over-applied; easy to tip “showy” without restraint.
- **Effort:** Large.

---

## 3) Recommended Direction + Definition Sprint Plan (90 minutes)

### Recommended North Star: Direction 1 — Quiet Monument Editorial
- **Why:** best ethos fit + least friction with existing repo structure (you already have cinematic modules + reduced-motion patterns; this direction is system cohesion and restraint, not new complexity).

### 90-minute “definition sprint” (no implementation yet)
- **Define type tokens (conceptually):**
  - 6-level scale, case rules (where uppercase is allowed), line-length targets, and rules for italics.
  - Decide whether to properly load the serif referenced by tokens in `src/app/globals.css:1` or change the serif strategy intentionally.
- **Define motion tokens (conceptually):**
  - 3 primitives (Breath reveal / Settle / Glide), 1 cinematic easing, 1 UI easing, and a “what stays still” rule.
  - Standard reduced-motion behavior: parallax off, sticky/pin off, swap to static stacking.
- **Prototype targets (highest leverage):**
  - Typography anchors: `src/components/ui/heading.tsx:1`, `src/components/ui/text.tsx:1`
  - Validate on: Home hero `src/components/home/hero-banner.tsx:1` and one assistant surface `src/components/chat/ChatPanel.tsx:1`
- **Success criteria:**
  - **Qualitative:** fewer typographic “shouts”; more hush + authority; motion feels like breath not templates.
  - **Quant guardrails:** preserve existing LCP strategy (e.g., hero preloads in `src/app/head.tsx:1`); no new always-on scroll work beyond current signature modules; avoid CLS (don’t animate layout).

---

## 4) Questions I’d ask next (max 5)

1. Should primary nav remain Perazzi red by default (`src/components/primary-nav.tsx:1`), or shift quieter with red as accent?
2. Do you want serif to feel “classical Italian atelier” (warmer) or “modern editorial” (crisper)? (Determines whether the current serif reference is the right choice.)
3. How sacred is uppercase/italic—should it become metadata-only, or remain a broader motif?
4. For Concierge + Chat, should the UI feel more “atelier companion” (narrative hush) or “precision tool” (utilitarian calm)?
5. Which single page must feel most like Perazzi: Home (`src/app/(site)/page.tsx:1`), Heritage (`src/app/(site)/heritage/page.tsx:1`), Shotguns (`src/app/(site)/shotguns/page.tsx:1`), or The Build (`src/app/(site)/the-build/why-a-perazzi-has-a-soul/BuildJourneyClient.tsx:1`)?
