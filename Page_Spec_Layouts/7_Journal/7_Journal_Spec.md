
# Journal – Section Spec (Section 7)

## Purpose & Emotional Arc
**Where the story breathes.** The Journal is a calm, curated space for **Stories of Craft**, **Champion Interviews**, and **News & Announcements**—a magazine‑grade editorial experience that deepens belonging and understanding. We promise clarity and craft: slow editorial pacing, human tone, precise dates, and a careful index that lets readers wander with purpose. The invitation is to stay, learn, and return—not to skim and bounce.

---

## Section‑wide Data Bindings (recap)
- **Article:** `{ id, slug, title, dekHtml?, hero: FactoryAsset, bodyPortableText[], authorRef, dateISO, readingTimeMins, category: "craft"|"interviews"|"news", tags: string[] }`
- **Author:** `{ id, name, slug?, bioHtml?, headshot?: FactoryAsset, links?: Array<{ label, href }> }`
- **Category:** `{ id, key:"craft"|"interviews"|"news", title, subtitleHtml? }`
- **Tag:** `{ id, label, slug, count? }`
- **Featured:** `ArticleRef` for Journal home & category headers
- **Search result:** union of ArticleRef minimal fields

> `FactoryAsset { id:string; kind:"image"|"video"; url:string; alt:string; captionHtml?:string; aspectRatio?:number }`

---

## Section‑wide State & Variation
- **Mobile/Desktop:** Grids → stacked; filters collapse on mobile; sticky meta bar only `lg↑`; ToC hidden by default on mobile with toggle.
- **Reduced‑motion:** Remove parallax & staggers; ToC/jumps fade instantly; reading progress disabled or static.
- **Locale:** Dates via `Intl.DateTimeFormat`; reading time localized (“~7 min read”); avoid text in images.
- **Dark/Light:** Tokenized backgrounds; editorial body line‑height and contrast tuned; code blocks with strong contrast.

---

## Tech Notes & Fallbacks
- **Stack:** Next 15 (App Router / RSC / TS), Tailwind + Radix (Dialog/Popover/Collapsible), Sanity Portable Text, `next/image` + Cloudinary (unsigned), CSS/WAAPI; Framer Motion optional for subtle fades (off under reduced‑motion).
- **Routing & SEO:** ISR for article pages; canonical URLs; OG/Twitter from hero; accurate `datePublished`/`dateModified`. Structured data: **Article**/**NewsArticle** (news), **BreadcrumbList**, **Organization** (global).
- **Pagination:** Cursor or numbered; **no infinite scroll**; “Load more” acceptable; preserve sort/filter in URL.
- **Search:** Debounce preview optional; SSR results page for robustness; maintain focus on results heading after submit.

---

## No‑Regrets Checklist (section)
- **Performance:** Journal home/category heroes hit **LCP ≤ 2.5 s**; article hero reserved; below‑fold media lazy; **CLS ≤ 0.05**; ToC/progress never thrash layout.
- **A11y:** Strict heading hierarchy; labeled ToC `<nav>` + **Skip ToC** link; sticky meta is a landmark; share buttons labeled; dialogs/lightboxes trap focus & close with ESC; descriptive links; reduced‑motion honored.
- **Editorial integrity:** Dates precise; evergreen tone for craft/interviews; news factual & restrained; no sponsor clutter; invitation‑led CTAs.
- **Analytics:** `JournalHeroSeen`, `FeaturedStoryClick`, `CategoryTabClick:{key}`, `FilterChanged:{key}`, `SearchSubmitted`, `ArticleImpression:{slug}`, `ArticleReadStart:{slug}`, `ArticleReadDepth:{25|50|75|100}`, `TOCJump:{heading}`, `LightboxOpen:{assetId}`, `RelatedClick:{slug}`, `SubscribeSubmit`.
