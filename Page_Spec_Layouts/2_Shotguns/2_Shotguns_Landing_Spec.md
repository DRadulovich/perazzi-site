files["2_Shotguns_Landing_Spec.md"] = textwrap.dedent("""\
# Shotguns – Landing (Hub)

## 1) Purpose & Emotional Arc
Begin with calm clarity: choose by lineage and purpose, then let fit, balance, and craft refine the journey. The voice is invitational—“the hands of the artisan, the heart of the shooter” guiding a partner for your path.

## 2) Component Stack (top → bottom)

### A. **Section Hero – “Platforms & Purpose”** *(reuse; unchanged)*
**Purpose:** Establish that Perazzi selection begins with identity and discipline, not product codes.  
**Fields:** Title; subheading (1–2 lines on platform lineage & disciplines); background image (platform still‑life or artisan detail); optional breadcrumb.  
**States/Interactions:** Static; scroll cue; header reduces on scroll.  
**Motion:** Text fade‑in (ease‑out 600ms) after LCP; subtle background drift; disabled on reduced‑motion.  
**Media:** `next/image` art‑directed crops; AVIF/WebP sources; poster for any ambient loop.  
**Perf:** Target LCP ≤ 2.5s; reserve height to keep CLS ≤ 0.05.  
**A11y:** `<h1>` present; 4.5:1 contrast; decorative background uses empty `alt`.

### B. **Platform Trio Grid (MX / High Tech / TM)** *(reuse; unchanged)*
**Purpose:** Present the three archetypes—**MX** (O/U with drop‑out trigger), **High Tech** (centered‑mass evolution), **TM** (single‑barrel trap)—as living lineages, not SKUs.  
**Fields:** For each Platform: title; 40–80 word lineage blurb; key hallmark (e.g., “drop‑out trigger”); hero image; CTA (“Explore the ${Platform} Lineage”).  
**States/Interactions:** Card hover = image lift 2px + underline; click navigates to series page.  
**Motion:** Staggered reveal (50 ms cadence, ease‑out 400 ms).  
**Media:** One hero image per platform; keep focal subject centered; avoid text‑in‑image.  
**Perf:** Lazy‑load offscreen cards; `priority` only for first visible card.  
**A11y:** `<a>` wraps card; full‑tile focus ring; alt text references platform (e.g., “MX8 receiver—drop‑out trigger”).

### C. **Trigger Explainer** *(new compact module)*
**Purpose:** Editorial orientation on **removable vs. fixed** triggers; anchor understanding of MX/HT vs MX12/HTS without specs—convey meaning.  
**Content Fields:**  
- **Title:** “Triggers, simply”  
- **Copy (2–3 sentences):** Perazzi’s **drop‑out** (MX/HT) is trusted for speed and serviceability in competition; **fixed** (MX12/HTS) embodies elegant simplicity and continuity. Both share the same soul—choose by confidence and feel.  
- **Diagram:** Simple line diagram (two silhouettes “Removable” vs “Fixed”), captions in HTML.  
- **Inline Links:** “Explore MX12 (fixed)”, “Explore HTS (fixed)”.  
**States & Interaction:** Static on desktop; collapsible (Radix `<Collapsible>`) on mobile with height/opacity transition; `prefers-reduced-motion` → instant open/close.  
**Perf:** Inline SVG preferred; lazy‑load diagram; no LCP/CLS impact.

### D. **Disciplines Rail (Trap / Skeet / Sporting Clays)**
**Purpose:** Reframe by use‑case; map disciplines to recommended platforms and typical setups.  
**Fields:** For each discipline: short overview; 1–3 recommended platforms; champion callout (name/title/`<blockquote><cite>`).  
**States/Interactions:** Horizontal scroll on mobile (CSS scroll‑snap) with explicit Prev/Next buttons; 3‑up grid on desktop. Quotes expand on focus/hover. JS failure or reduced‑motion → render as static list (`<ul>`).  
**Motion:** Section fade‑in; card slide‑in (ease‑in‑out ≈300 ms).  
**Media:** Action imagery per discipline; ensure safe depictions.  
**A11y:** Visible Prev/Next buttons (`aria-label="Previous slide" / "Next slide"`); `aria-live="polite"` announces “Slide x of y: {discipline}”; no keyboard trap; cards are focusable.

### E. **Fit & Feel Primer – “Gauges & Balance”** *(teaser; reuse)*
**Purpose:** Plant the idea that handling is a **craft outcome** (gauge, frame mass, barrel length).  
**Fields:** 2–3 bullets (e.g., 12ga stability; 20/28 agility; barrel contour tunes swing); link to Gauges page.  
**States/Interactions:** Static; link hover.  
**Motion:** Simple fade‑up; disabled in reduced‑motion.  
**Media/Perf/A11y:** Minimal iconography; high contrast; no heavy assets.

### F. **Personal Artistry – “Grades & Custom”** *(teaser; reuse)*
**Purpose:** Invite exploration of engraving and wood as expressions of identity (SC2/SC3/SCO tiers).  
**Fields:** Engraving tile (image + label); Wood‑grade tile; link to full page.  
**Interactions:** Hover → short description; click navigates.  
**Motion:** Gentle cross‑fade on hover/focus.  
**A11y:** Descriptive alt text; visible focus rings.

### G. **CTASection – “Begin Your Fitting”** *(normalized)*
**Primary CTA:** *Begin Your Fitting*  
**Secondary:** *Request a Visit*  
**States/Perf/A11y:** Button hover/focus; route prefetch; high contrast; keyboard accessible.

## 3) Data Bindings (Landing)
- **Platform/Frame:** MX / High Tech / TM; **MX12 / HTS** links for fixed‑trigger counterparts (via platform relations).  
- **Discipline:** Trap / Skeet / Sporting (overview; featured champions; platform relations).  
- **Gauge:** `12/20/28/.410` handling guidance.  
- **Grade:** SC2/SC3/SCO exemplars.  
- **Champion:** Quotations within Discipline cards (evergreen).  
- **Factory Asset:** Optional hero/diagram imagery.  
- **Article:** Optional related editorial.

## 4) State / Variation (Landing)
- **Mobile/Desktop:** Grids → stacks; Trigger Explainer collapsible on mobile; rail → snap carousel with visible controls.  
- **Reduced‑motion:** No carousel motion; disclosures instant; simple fades only.  
- **Locales:** `next-intl`; editorial text localized; inline links localized.  
- **Dark/Light:** Tokenized backgrounds; diagram colors swap for contrast.

## 5) Tech Notes & Fallbacks (Landing)
- **Primary:** Next 15 (App Router/RSC/TS); Tailwind + Radix; Sanity; `next/image` + Cloudinary; CSS/WAAPI + Framer Motion; GSAP only if necessary; Vercel Analytics.  
- **Fallbacks:** Carousel → list; diagram → text; CMS down → baked editorial copy/images.

## 6) No‑Regrets (Landing)
- LCP ≤ 2.5 s; CLS ≤ 0.05.  
- Rails operable via keyboard; `aria-*` on controls; visible focus; captions for diagrams.  
- Consistent “Begin Your Fitting” (primary) and “Request a Visit” (secondary) CTAs.
""")