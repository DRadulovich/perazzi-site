# Service & Parts – Section Spec (Section 6)

## Purpose & Emotional Arc
**From ownership to stewardship.** Service is the care of a lifelong instrument—preserving balance, feel, and soul—not a repair counter. We promise **clarity, integrity, and continuity**: what to do, who will touch your gun, and how long it takes—stated simply and calmly. The invitation is to honor the instrument so it remains perfect for decades, never to buy.

---

## Section‑wide Data Bindings (recap)
- **ServiceHero:** `{ title: string; subheading?: string; background: FactoryAsset }`
- **ServiceOverview:** `{ introHtml: string; checksHtml: string }`
- **ServiceLocations:** `Array<{ id:string; name:string; type:"Factory"|"Service Center"|"Specialist"; addressHtml:string; phone?:string; email?:string; website?:string; notesHtml?:string }>`
- **MaintenanceGuides:** `Array<{ id:string; title:string; summaryHtml:string; fileUrl:string; fileSize?:string }>`
- **PartsEditorial:** `Array<{ name:string; purpose:string; fitment:"factory"|"authorized"|"user"; notesHtml?:string }>`
- **FAQ:** `Array<{ q:string; aHtml:string }>`
- **Requests:** (routes/embeds only; data posted to backend or third‑party)
- **CTA copy:** localized via `next-intl`

> `FactoryAsset { id:string; kind:"image"|"video"; url:string; alt:string; captionHtml?:string; aspectRatio?:number }`

---

## Section‑wide State & Variation
- **Mobile vs Desktop:** Lists stack; finder shows filter + results; optional map embed loads on demand; forms inline or dialogs; CTAs near fold.  
- **Reduced‑motion:** Remove parallax/staggers; collapsibles open/close instantly; dialogs/iframes appear without transitions.  
- **Locale:** All copy localized; addresses/phone formats per locale; avoid text in images.  
- **Dark/Light:** Tokenized backgrounds; contrast ≥ 4.5:1; visible focus rings; link colors meet contrast.

---

## Tech Notes & Fallbacks
- **Stack:** Next 15 (App Router/RSC/TS), Tailwind + Radix (Dialog/Collapsible), Sanity (read‑only), `next/image` + Cloudinary, CSS/WAAPI; Framer Motion optional for minor fades only; no GSAP needed.  
- **Embeds:** Third‑party forms and optional map are click‑to‑load; iframes have descriptive `title`; always provide fallback links (new tab, `rel="noopener noreferrer"`).  
- **JSON‑LD:** Optional **FAQPage** block for genuine Q/A; render server‑side.  
- **Fallbacks:** JS off → finder works as filter + list; downloads are plain links; forms route to external pages; collapsibles render open.

---

## No‑Regrets Checklist (section)
- **Performance:** Hero **LCP ≤ 2.5s**; **CLS ≤ 0.05**; filters instant; embeds on demand; no long tasks; images lazy where appropriate.  
- **A11y:** Keyboardable filters/results; titled iframes; collapsibles/dialogs with correct `aria-*`; error messages announced via `aria-live`; contrast ≥ 4.5:1; visible focus.  
- **Integrity:** Calm, evergreen guidance; **no pricing**; **no DIY gunsmithing** instructions; safety‑aware language; authorized service emphasis; genuine parts only rationale.  
- **Analytics:** `ServiceHeroSeen`, `FinderFilterChange`, `FinderResultClick:{id}`, `RequestServiceOpen`, `RequestPartsOpen`, `GuideDownload:{id}`, `FAQViewed:{index}`, `FinalCTAClicked:{primary|secondary}`.
