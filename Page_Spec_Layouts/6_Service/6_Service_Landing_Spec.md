# Service & Parts – Landing (Hero & Overview)

## A. Service Hero — “Care for a Lifelong Instrument” *(reuse `HeroBanner` with atelier/service imagery)*
**Purpose:** Position service as stewardship; reassure with calm authority.  
**Fields:** `title: "Service & Parts"`, `subheading?: string`, `background: FactoryAsset` (bench detail, proof tunnel silhouette, locking surfaces). `breadcrumb?`  
**States & Interaction:** Static hero; optional scroll cue.  
**Motion Grammar:** Text fade (ease‑out ≈600ms); optional subtle parallax if `prefers-reduced-motion` is false.  
**Image/Video Guidelines:** LCP background—authentic, text‑free; keep focal region behind copy readable; AVIF/WebP or MP4+poster for short, muted loop.  
**Performance:** Preconnect/preload hero; reserve aspect‑ratio; **LCP ≤ 2.5s**, **CLS ≤ 0.05**.  
**A11y:** `<h1>` present; contrast ≥ 4.5:1; background `alt=""`; breadcrumb in `<nav aria-label="Breadcrumb">`.

## B. Service Overview — “How We Care” *(new; editorial block)*
**Purpose:** One‑screen explanation of care and spirit: inspection, pattern/POI check, spring refresh, timing; **what it excludes** (pricing tables, DIY gunsmithing).  
**Fields:** 150–220‑word intro; **Core Checks** bulleted list (Inspection; Pattern/POI verification; Springs & timing; Ejector/firing pin check; Functional proof); lead‑time note framed as craft (“ready when it’s ready,” indicative ranges only).  
**States & Interaction:** Static, text‑first; no toggles.  
**Motion/Perf/A11y:** None or gentle fade‑up (off under reduced‑motion); semantic headings/lists; legible line‑length; high contrast.
