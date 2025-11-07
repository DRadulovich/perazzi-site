files["5_Experience_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Section Spec (Section 5)

## Purpose & Emotional Arc
**From audience to participant.** Here, the reader becomes a guest—visit, fit, and feel—stepping inside a living tradition with calm guidance. We promise clarity and care: expectations are precise, scheduling is simple, and every step is an invitation—not a push.

---

## Section‑wide Data Bindings (recap)
- **ExperienceHero:** `{ title: string; subheading?: string; background: FactoryAsset }`
- **ExperiencePicker:** `Array<{ id:string; title:string; summary:string; media:FactoryAsset; ctaLabel:string; href:string }>`
- **Visit (Factory):** `{ name:string; addressHtml:string; mapEmbedSrc?:string; staticMap:FactoryAsset; hoursHtml?:string; notesHtml?:string; whatToExpectHtml?:string; cta:{ label:string; href:string } }`
- **FittingOptions:** `Array<{ id:string; title:string; durationMins:number; descriptionHtml:string; href:string }>`
- **DemoProgram:** `{ introHtml:string; events?: Array<{ id:string; date:string; clubName:string; cityState:string; href?:string }>; requestCta:{ label:string; href:string }; whatToExpectHtml?:string }`
- **Mosaic:** `Array<FactoryAsset>`
- **FAQ:** `Array<{ q:string; aHtml:string }>`
- **CTA copy:** localized via `next-intl`.

> `FactoryAsset { id:string; kind:"image"|"video"; url:string; alt:string; captionHtml?:string; aspectRatio?:number }`

---

## Section‑wide State & Variation
- **Mobile vs Desktop:** Cards stack; map is click‑to‑load; lightbox thumbs full‑width; FAQ may use collapsibles; CTAs near fold and footer.
- **Reduced‑motion:** Remove parallax and staggers; collapsibles open/close instantly; lightbox opens without transitions.
- **Locale:** All copy localized (via `next-intl` or localized CMS fields); addresses and date formats per locale; avoid text baked into imagery.
- **Dark/Light:** Tokenized backgrounds; captions readable on both; ensure contrast ≥ 4.5:1; focus rings visible in both themes.

---

## Tech Notes & Fallbacks
- **Stack:** Next 15 (App Router/RSC/TS), Tailwind CSS, Radix UI (Dialog/Collapsible), Sanity (read‑only via CDN), `next/image` + Cloudinary (unsigned), CSS/WAAPI; Framer Motion only where helpful (off under reduced‑motion).
- **Embeds:**  
  - **Map:** lazy iframe with descriptive `title`; provide static image fallback + “Open in Maps” link; do not block main thread.  
  - **Scheduler:** load on demand after user click; accessible iframe `title`; provide fallback link; announce new‑tab behavior via visually hidden text when applicable.
- **JSON‑LD:** Optionally output **FAQPage** block when FAQs present (server‑side).
- **Fallbacks:** JS‑off → ExperiencePicker cards remain links; map replaced by static image + link; lightbox becomes plain anchors; FAQ rendered as open list; booking links go to external scheduler page.
- **Performance:** Hero as **LCP ≤ 2.5 s**; **CLS ≤ 0.05**; embed loads only on user action; mosaic thumbs lazy; no long‑task script blocks.

---

## No‑Regrets Checklist (section)
- **Performance:** LCP and CLS budgets met; embeds on demand; lazy media; smooth interaction.  
- **A11y:** Keyboardable routes and dialogs; map iframe titled; substantial focus states; contrast ≥ 4.5:1; FAQ headings; reduced‑motion respected throughout.  
- **Content integrity:** Clear expectations and safety‑aware copy; no pricing tables; invitation‑led CTAs; no sponsor clutter.  
- **Analytics:** `ExperienceHeroSeen`, `PickerCardClick:{id}`, `VisitMapOpen`, `VisitCtaClick`, `FittingCtaClick:{id}`, `DemoEventOpen:{id}`, `DemoRequestClick`, `MosaicLightboxOpen:{assetId}`, `FAQViewed:{index}`, `FinalCTAClicked:{primary|secondary}`.
""")