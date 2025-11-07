files["2_Shotguns_Gauges_Spec.md"] = textwrap.dedent("""\
# Gauges & Calibers

## 1) Purpose & Emotional Arc
A concise primer that demystifies feel—how gauge, frame size, and barrel contour translate to swing, recovery, and confidence. Invite the reader to listen to the gun’s “voice,” not just the numbers.

## 2) Component Stack
- **Hero – “Gauges & Balance”** *(reuse)*  
- **Gauge Explainer Cards** *(reuse)*: 12/20/28/.410; each card notes handling & typical disciplines.  
- **Frame Sizes & Balance Primer** *(reuse)*: editorial block on HT/MX weight distribution.  
- **Pattern & POI Sidebar** *(reuse)*: short note on harmonics & POI tuning; links to disciplines.  
- **NEW Gauge FAQ (2–3 items) + JSON‑LD**:  
  - *How does gauge affect felt recoil and recovery?* — 12 ga offers stable mass and smooth recovery; 20/28 favor agility and speed—final feel is tuned in fitting and barrel contour.  
  - *When choose high vs flat ribs?* — High/adjustable ribs aid rising targets & sustained leads; flat/low ramp provide versatile sight picture for mixed presentations.  
  - *Does barrel length change my swing?* — Longer barrels steady/lengthen swing; shorter increase reactivity; both can be balanced to your style.  
  - **Inject FAQPage JSON‑LD** server‑side (App Router metadata or `<Script type="application/ld+json">`).

**Motion/Perf/A11y:** Mostly text; card reveal only; reserve image aspect ratios; ensure contrast; if FAQ collapsible on mobile, use proper ARIA and instant open/close under reduced‑motion.

## 3) Data Bindings (Gauges)
Gauge entities; editorial FAQ copy from CMS; platform/frame notes; discipline links.

## 4) State / Variation
Mobile: FAQ collapsible; desktop static list; reduced‑motion disables animations; localized; dark/light tokens.

## 5) Tech Notes & Fallbacks
Use `next/head` or route `generateMetadata` for JSON‑LD; if CMS missing FAQ, supply two evergreen Q/A as fallback; `next/image` with Cloudinary unsigned URLs.

## 6) No‑Regrets
No pricing/spec tables; FAQ validates; CTA clicks tracked from sidebar; CLS ≤ 0.05; high‑contrast text.
""")