files["3_Bespoke_Landing_Spec.md"] = textwrap.dedent("""\
# Bespoke Build – Landing (Hero & Overview)

## A. Build Hero — “From Vision to Instrument” *(new; analogous to `HeroBanner`)*
**Purpose:** Establish the significance of commissioning a Perazzi; set the tone for the journey.  
**Fields:**  
- **Eyebrow:** “The Bespoke Journey”  
- **Title:** “From Vision to Instrument”  
- **Intro copy:** 1 short editorial paragraph framing the rite of passage (identity > transaction)  
- **Background media:** Full‑bleed atelier moment (hand on walnut blank; engraving glint; proof‑tunnel smoke).  
- **Optional:** Scroll indicator.  
**States & Interaction:** Static; scroll cue only.  
**Motion:** Headline fade‑in (~700 ms, ease‑out) after LCP; subtle parallax on media; disable under `prefers-reduced-motion`.  
**Media:** AVIF/WebP or MP4/WebM w/ poster; avoid text in image; keep focal region clear of overlays.  
**Perf:** Treat media as LCP; `preconnect` + `preload` hero asset; reserve aspect‑ratio to hold space (**CLS ≤ 0.05**).  
**A11y:** `<h1>` present; contrast ≥ 4.5:1; decorative backgrounds use empty `alt`; scroll indicator `aria-hidden="true"` or `aria-label`ed.

---

## B. Journey Overview — “What We’ll Create Together” *(new; analogous to `EditorialBlock`)*
**Purpose:** Provide a one‑screen summary of the steps ahead; orient the user and reduce anxiety.  
**Fields:**  
- **Intro (2–3 sentences)** setting expectations.  
- **Step list with anchors:** Discovery & Consultation → Precision Fitting (Try‑Gun) → Barrel & Regulation → Balance & Dynamics → Engraving & Wood → Delivery & On‑Range Validation.  
- **Disclaimer:** “Editorial guidance—your fitting personalizes every decision.”  
**Interaction:** Static; anchor links jump to each step section.  
**Motion:** Light staggered fade‑up (100–150 ms increments); no motion under `prefers-reduced-motion`.  
**Perf/A11y:** Pure HTML; semantic headings; anchor links keyboard‑focusable; clear focus ring.
  
---

## G. Final CTA — “Begin Your Fitting” *(reuse `CTASection`)*
**Primary:** *Begin Your Fitting*  → booking route  
**Secondary:** *Request a Visit* → visit page  
**Motion/A11y/Perf:** As in Home/Shotguns; route prefetch; visible focus; 4.5:1 contrast; ensure placement near fold on mobile.
""")