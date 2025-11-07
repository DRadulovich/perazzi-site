files["4_Heritage_Landing_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Landing (Hero)

## A. Heritage Hero — “The Lineage” *(reuse `HeroBanner`, historic imagery)*
**Purpose:** Set a reverent aperture; situate the visitor inside a living continuum.  
**Fields:**  
- **Title:** “Heritage & History”  
- **Subheading (1–2 lines):** On belonging through time—craft handed forward.  
- **Background media:** Archival still (workshop, early action) or short ambient loop (engraving glint, factory silhouette)  
- **Optional:** Breadcrumb  
**States & Interaction:** Static; optional scroll cue.  
**Motion Grammar:** Subtle fade‑in of text; gentle parallax on background only when `prefers-reduced-motion` is false.  
**Image/Video Guidelines:** Authentic archival‑like imagery; avoid text‑in‑image; maintain focal area for legible overlays.  
**Performance:** Treat background as **LCP**; `preconnect` + `preload`; reserve aspect‑ratio to keep **CLS ≤ 0.05**; AVIF/WebP (images) / MP4+poster (video); target **LCP ≤ 2.5 s**.  
**A11y:** `<h1>` present; 4.5:1 contrast; background `alt=""` if decorative; breadcrumb uses `<nav aria-label="Breadcrumb">`.
""")