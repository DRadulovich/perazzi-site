files["2_Shotguns_Grades_Spec.md"] = textwrap.PlainTextFormatter().fill("""\
# Grades & Custom Options

## 1) Purpose & Emotional Arc
Show personal artistry—engraving and wood as expressions of identity, handled with reverence, never as upsell.

## 2) Component Stack
- **Hero – “Grades & Custom”** *(reuse)*  
- **Engraving Gallery (lightbox)** *(reuse; captions strengthened)*:  
  - Captions must be descriptive and non‑commercial (e.g., “Deep English scroll along the action flanks; note the hand‑cut shading.”).  
  - Thumbnails lazy‑load; full‑res prefetch on open.  
  - Radix Dialog; `aria-modal="true"`; ESC closes; focus trap.
- **Wood Grade Selector (carousel)** *(reuse)*: Describe figure and finishing qualities; keyboard accessible.  
- **NEW Engraving Provenance (one paragraph)**:  
  Clarify house patterns vs master engravers editorially. Example: *Perazzi offers classic house patterns rooted in Italian tradition and collaborates with master engravers for singular commissions. Each surface is a canvas for restraint or flourish—guided by the same reverence for artistry and permanence.*  
- **Personalization Options** *(reuse)*  
- **Process Note** *(reuse)*  
- **CTASection – “Request an engraving consult”* *(normalized)*

## 3) Data Bindings (Grades)
Grade entities (SC2/SC3/SCO) with gallery assets (captions via `alt` or explicit field); provenance copy; personalization options; factory/craft notes.

## 4) State / Variation
Mobile: gallery/option lists stack; reduced‑motion disables transitions; localized captions; high contrast.

## 5) Tech Notes & Fallbacks
Lightbox via Radix Dialog; `next/image` for thumbnails; if JS disabled, anchors open images directly; keep captions visible in DOM for assistive tech.

## 6) No‑Regrets
No sponsor/pricing language; gallery open/next/prev tracked; CTA visible and accessible; CLS ≤ 0.05 throughout.
""")