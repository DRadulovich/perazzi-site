files["2_Shotguns_Series_Spec.md"] = textwrap.dedent("""\
# Platforms & Frames → MX / High Tech / TM (Series Pages)

## 1) Purpose & Emotional Arc
Each series page honors a lineage: **MX** (Olympic‑bred O/U, drop‑out trigger); **High Tech** (MX evolved, centered mass); **TM** (single‑barrel trap, fixed‑trigger purpose). The tone is reverent and editorial—why it feels right, not just how it’s built.

## 2) Component Stack (per series)

### A. **Series Hero** *(reuse)*
Name the lineage and set a reverent tone.  
**Fields:** Title (e.g., “MX Series”), 1–2 line lineage statement, close‑up hero image (`next/image`), **LCP** with high contrast.

### B. **At a Glance** *(new 3 rows)*
**Purpose:** Compact editorial snapshot.  
**Rows:**  
- **Trigger Type:** e.g., “Drop‑out trigger for confident service under pressure” (MX/HT) / “Fixed trigger for serene simplicity” (TM/MX12/HTS)  
- **Weight Distribution:** e.g., “Centered mass for fluid swing” (HT); “Classic low‑profile equilibrium” (MX); “Single‑barrel poise” (TM)  
- **Typical Disciplines:** e.g., “Sporting, Trap doubles” (MX/HT) vs “Trap singles/handicap” (TM)  
**Fields:** Three text rows; optional micro‑icons; series‑scoped links to discipline pages.  
**Interaction:** Static; links keyboard‑focusable.  
**A11y/Perf:** Use `<dl>` semantics; high contrast; light fade‑in.

### C. **Series Story Block** *(reuse)*
Editorial lineage narrative (e.g., MX: from Mexico City 1968 to present); one milestone callout.  

### D. **Engineering Highlights Grid** *(reuse)*
Three editorial tiles (e.g., Drop‑out Trigger / Boss‑type Locking / Balance & Ribs).  
**Fields:** Title; 40–70 word explainer; diagram/photo (`next/image` or inline SVG).  
**Motion/Perf/A11y:** Staggered reveal; lazy‑load images; semantic cards with captions.

### E. **Discipline Mapping** *(reuse)*
Chips for relevant disciplines; per‑discipline rationale; link to discipline pages.  
**Interaction:** Chip hover highlights description; list fallback on mobile.

### F. **Champion Spotlight** *(reuse; guardrailed)*
Use verified evergreen profiles only; if none, fallback to generic lineage quote.  
**Fields:** Name; title; quote; portrait image with alt text.  

### G. **Related Reading** *(reuse)*
2–3 journal articles (engineering stories, interviews).

### H. **CTASection** *(reuse)*
Primary: **Begin Your Fitting**; Secondary: **Request a Visit**.

## 3) Data Bindings (Series)
- **Platform (Series):** MX / High Tech / TM (name, lineage, images, kind)  
- **Discipline:** relations per series; rationale copy  
- **Champion:** evergreen quote + image (optional)  
- **Article:** related stories  
- **Factory Asset:** highlights/hero imagery

## 4) State / Variation (Series)
Responsive grids; reduced‑motion removes stagger/pinning; localized copy; dark/light tokens.

## 5) Tech Notes & Fallbacks (Series)
Same base stack as Landing; At‑a‑Glance is pure HTML/CSS; if diagrams fail, show text alternatives.

## 6) No‑Regrets (Series)
Hero meets LCP; links clearly labeled; highlight views + CTA clicks tracked.
""")