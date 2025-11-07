files["4_Heritage_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Section Spec (Section 4)

## Purpose & Emotional Arc
**Lineage made visible.** This section gathers the threads—from Daniele’s first bench to Olympic podiums to today’s atelier—into an unbroken chain of excellence. We offer clarity and reverence: dates and facts are precise, the storytelling is human, and the invitation is to carry the story forward with calm authority.

---

## Section‑wide Data Bindings (recap)
- **HeritageEvent[]:** `{ id, date, title, summaryHtml, media?: FactoryAsset, links?: { articles?: ArticleRef[], platforms?: PlatformRef[], champions?: ChampionRef[] } }`
- **Champion (evergreen):** `{ id, name, title, quote, image: FactoryAsset, article?: ArticleRef, disciplines?: string[] }`
- **FactoryAsset:** `{ id, kind: "image"|"video", url, alt, captionHtml?, aspectRatio? }`
- **ArticleRef:** `{ id, title, slug }`
- **FactoryEssay[] (photo‑essay):** `{ id, image: FactoryAsset }`
- **OralHistory[] (optional):** `{ id, title, quote, attribution, audioSrc?, transcriptHtml?, image?: FactoryAsset }`
- **CTA copy:** localized via `next-intl`.

---

## Section‑wide State & Variation
- **Mobile vs Desktop:** Timeline becomes stacked list; markers optionally a horizontal scroll or jump list. Champions grid collapses to 1‑column; filter chips wrap; Factory essay uses swipe or stacked thumbs.
- **Reduced‑motion:** No parallax; timeline panel swaps are instant; lightbox & drawers have no transitions; audio has no visual motion beyond control state.
- **Locale:** Dates formatted per locale (Intl.DateTimeFormat); all text from localized fields; avoid text in images.
- **Dark/Light:** Tokenized backgrounds; captions and markers maintain ≥ 4.5:1; focus rings visible in both themes.

---

## Tech Notes & Fallbacks
- **Stack:** Next 15 (App Router/RSC/TS), Tailwind, Radix UI (Dialog/Collapsible), Sanity (read‑only via CDN), `next/image` + Cloudinary, CSS/WAAPI; Framer Motion used sparingly for marker/content transitions if needed (off in reduced‑motion).
- **Structured Data:** Global **Organization** schema in site metadata. Optional **FAQPage** JSON‑LD only where genuine Q/A exists. Avoid **Event** unless current events exist.
- **Fallbacks:** Timeline degrades to `<ol>` with headings and images; markers become skip‑list. Lightbox falls back to links to full‑size images. Audio requires transcript; if audio fails, transcript remains primary content.
- **Performance:** Heritage hero is LCP; defer below‑fold media; prefetch next timeline event asset; **CLS ≤ 0.05**; validate with Lighthouse/WebPageTest.

---

## No‑Regrets Checklist (section)
- **Performance:** LCP ≤ 2.5 s (hero); CLS ≤ 0.05; smooth marker navigation; lazy media.
- **A11y:** Keyboardable timeline; `aria-current` on active marker; **Skip timeline** link; Dialog focus trap & ESC; transcripts for all audio; strong contrast and visible focus.
- **Content integrity:** Dates & attributions precise; evergreen champions only (fallback to lineage quote if none); captions descriptive & non‑commercial; safety‑aware imagery.
- **Tone & CTAs:** Invitation‑led (“Request a Visit”, “Begin Your Fitting”); no sponsor clutter; no commerce UI.
- **Analytics:** `HeritageHeroSeen`, `TimelineEventViewed:{id}`, `TimelineLearnMore:{id}`, `ChampionCardViewed:{id}`, `ChampionProfileOpen:{id}`, `FactoryLightboxOpen:{imageId}`, `FinalCTAClicked:{primary|secondary}`.
""")