files["5_Experience_Landing_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Landing (Hero & Picker)

## A. Experience Hero — “Step Inside” *(reuse `HeroBanner` with experience imagery)*
**Purpose:** Offer a calm invitation into the living brand—“Visit, Fit, and Feel.”  
**Fields:**  
- **Title:** “Experience Perazzi”  
- **Subheading:** 1–2 lines on visit/fitting/demo as rites of passage  
- **Background Media:** Atelier, range, or showroom still/loop (LCP)  
- **Optional:** Breadcrumb  
**States & Interaction:** Static; optional scroll cue.  
**Motion Grammar:** Text fade (ease‑out ≈600 ms); optional subtle parallax (disabled under `prefers-reduced-motion`).  
**Image/Video:** LCP media is authentic, text‑free; ensure focal area behind type remains readable; AVIF/WebP or MP4+poster for loop.  
**Performance:** Preconnect + preload; reserve aspect‑ratio; **LCP ≤ 2.5 s**, **CLS ≤ 0.05**.  
**A11y:** `<h1>` present; contrast ≥ 4.5:1; background `alt=""`; breadcrumb in `<nav aria-label="Breadcrumb">`.

---

## B. Experience Picker — “Choose Your Path” *(new; three entry cards)*
**Purpose:** Orient instantly to three pathways: **Visit the Factory**, **Book a Fitting**, **Try a Demo**.  
**Fields (per card):** `title`, `summary`, `media: FactoryAsset` (icon/thumbnail), `ctaLabel`, `href`.  
**States & Interaction:** Each card is a full‑tile link (`<a>`), keyboard‑focusable; optional Radix popover for quick facts on focus/hover.  
**Motion:** Light stagger (100 ms between, 250 ms fade/translate); removed under reduced‑motion.  
**Image/Video:** Small, color‑fast assets; consistent iconography.  
**Performance:** Static cards; images lazy‑load below the fold.  
**A11y:** Card acts as a single link with a clear title; visible focus ring; popover uses `aria-controls`/`aria-expanded` if used; all text meets contrast.
""")