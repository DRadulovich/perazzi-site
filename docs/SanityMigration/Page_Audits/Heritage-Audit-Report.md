# Sanity Content Audit – Heritage

## Overview
- The Heritage page tells Perazzi’s lineage, timelines, champions, factory essay, oral histories, and a serial-number lookup. This audit maps each visible UI element to either Sanity-driven content or hard-coded sources.

## Route & Files Scanned
- Primary route: `src/app/heritage/page.tsx`
- Components: `src/components/heritage/HeritageHero.tsx`, `PerazziHeritageEras.tsx` (+ `HeritageErasStack.tsx`, `HeritageEraSection.tsx`, `HeritageEventSlide.tsx`), `ChampionsGallery.tsx`, `FactoryPhotoEssay.tsx`, `SerialLookup.tsx`, `OralHistories.tsx`
- Shared components: `src/components/shotguns/RelatedList.tsx`, `src/components/shotguns/CTASection.tsx`, `src/components/home/scroll-indicator.tsx`
- Data helpers: `src/lib/heritage-data.ts`, `src/utils/heritage/groupEventsByEra.ts`, `src/config/heritage-eras.ts`
- Static seed content: `src/content/heritage/*` (hero, timeline, champions, factoryEssay, factoryIntro, oralHistories, related, finalCta)
- Sanity queries: `src/sanity/queries/heritage.ts`, `src/sanity/queries/manufactureYear.ts`
- Sanity schemas: `sanity/schemas/documents/heritageHome.ts`, `sanity/schemas/heritageEvent.ts`, `sanity/schemas/champion.ts`, `sanity/schemas/manufactureYear.ts`

## Summary of Content Sources
- Roughly ~55% of visible content is CMS-driven (hero media/text, timeline events, champions, factory photo essay images, oral-history cards, serial lookup data). About ~45% is hard-coded (multiple intro sections, “Ask the workshop” blocks, hero breadcrumbs/labels, background images, factory intro text, related links, final CTA, chat prompt copy, serial lookup UI text).
- The page is partially CMS-editable: major datasets (hero/events/champions/oral histories/photo essay/serial ranges) live in Sanity, but most narrative and CTA copy remains in code.

## Detailed Findings by Section

### Heritage Hero (`src/components/heritage/HeritageHero.tsx`)
- Breadcrumb labels “Home”, “Heritage”, eyebrow “Heritage”, and “Scroll” label: **Hard-coded** (component).
- Hero title, subheading, background image: **Sanity CMS** `heritageHome.hero.{title,subheading,background}` via `getHeritageHome` (fallback `src/content/heritage/hero.ts`).

### Perazzi Heritage Intro Block (`src/app/heritage/page.tsx`:19-75)
- Eyebrow “Perazzi heritage”, heading “A living lineage of craft”, two intro paragraphs, “Skip Perazzi Timeline” links, background image `/redesign-photos/heritage/perazzi-legacy-lives-on.jpg`: **Hard-coded** in route.
- ScrollIndicator presence: **Hard-coded** component chrome.

### Heritage Eras Timeline (`PerazziHeritageEras` stack)
- Era metadata (labels, year ranges, background images, overlay colors): **Hard-coded** in `src/config/heritage-eras.ts`.
- Timeline events (date, title, summaryHtml, media, refs): **Sanity CMS** `heritageEvent` documents via `getHeritageEvents` → `mapEvents`; fallback seed `src/content/heritage/timeline.ts` if CMS empty.
- Event media (images), champion/platform references: **Sanity CMS** fields `heritageEvent.media`, `heritageEvent.champions[]`, `heritageEvent.platforms[]`.
- Event links buttons (none seeded) would render from `event.links` if provided; currently **CMS-derived** if added to mapped data.

### Ask the Workshop CTA (`src/app/heritage/page.tsx`:77-136)
- Heading “Ask the workshop”, supporting paragraph, bullets, closing paragraph, buttons “Immerse in the Perazzi Timeline” / “Check serial record”: **Hard-coded** in route.

### Serial Lookup (`src/components/heritage/SerialLookup.tsx`)
- Section heading “Heritage Record”, subheading “Discover when your story began”, instructions text, input label, button copy (“Reveal Record”, loading text), helper text, background image `/cinematic_background_photos/p-web-2.jpg`: **Hard-coded**.
- Lookup results data (year, proofCode, ranges, model) from **Sanity CMS** `manufactureYear` documents via `getManufactureYearBySerial` (query in `sanity/queries/manufactureYear.ts`; schema `manufactureYear.ts`).
- Error messages and empty-state text: **Hard-coded**.

### Champions Intro & Chat CTA (`src/app/heritage/page.tsx`:138-214)
- Heading “Champions past and present”, intro paragraph, ChatTrigger label/payload, bullets, closing paragraph: **Hard-coded** in route.

### Champions Gallery (`src/components/heritage/ChampionsGallery.tsx`)
- Section title “Perazzi Champions”, subheading “The athletes who shaped our lineage”, background image `/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg`, discipline filter labels, “Champions” label, empty-state quote, “Read full interview” text: **Hard-coded**.
- Champion data (name, title, quote, image, disciplines, platforms, bio, resume, article slug): **Sanity CMS** `champion` documents via `getHeritageChampions`; fallback seeds `src/content/heritage/champions.ts` if CMS empty.

### Factory Intro & Essay (`src/app/heritage/page.tsx`:216-286; `FactoryPhotoEssay.tsx`)
- Intro heading “Inside the Botticino atelier”, supporting paragraph, ChatTrigger label/payload, bullets, closing paragraph: **Hard-coded** in route.
- Factory essay section header/eyebrow text: **Hard-coded** in component.
- Intro body copy: **Hard-coded** `src/content/heritage/factoryIntro.ts`.
- Essay items (images, alt, captions): **Sanity CMS** `heritageHome.photoEssay[]` via `getHeritageHome`; fallback seeds `src/content/heritage/factoryEssay.ts`.

### Oral Histories (`src/components/heritage/OralHistories.tsx`)
- Section eyebrow “Oral histories”, heading “Voices from Botticino”, button copy “Read transcript/Hide transcript”: **Hard-coded** in component.
- History cards (title, quote, attribution, transcriptHtml, audioSrc, image): **Sanity CMS** `heritageHome.oralHistories[]` via `getHeritageHome`; fallback seeds `src/content/heritage/oralHistories.ts`.

### Related Reading (`src/components/shotguns/RelatedList.tsx`)
- Heading “Related reading” and link styling: **Hard-coded** in component.
- Related article list (title, slug): **Hard-coded** seeds `src/content/heritage/related.ts`.

### Final CTA (`src/components/shotguns/CTASection.tsx` used in page.tsx)
- Component heading “Begin your fitting”: **Hard-coded** inside `CTASection`.
- Body text and buttons: **Hard-coded** `src/content/heritage/finalCta.ts`.

## Migration Recommendations
- High: Move route-level intro/CTA blocks (“Perazzi heritage” intro, “Ask the workshop”, “Champions past and present”, “Inside the Botticino atelier” intro) into Sanity to let editors adjust narrative/bullets without code changes.
- High: Externalize Related reading list to Sanity (references to `article` docs) for updatable links.
- High: CMS-enable final CTA text/buttons (reuse a global CTA singleton or extend `heritageHome`).
- Medium: Allow editing of Champions Gallery headings/background and filter labels; optionally add `ctaLabel` for “Read full interview”.
- Medium: Add Sanity fields for SerialLookup UI copy (headings, helper text, button labels) while keeping lookup data in `manufactureYear`.
- Medium: Make Factory Intro text CMS-driven (field on `heritageHome`) and allow overriding the factory essay section heading/eyebrow.
- Low: Allow CMS control over era background images/overlay colors (`heritageHome` or separate `heritageSettings`) if design flexibility is desired.
- Low: Make hero breadcrumbs/eyebrow labels editable if needed for localization.

## Conclusion
- Approx. 55% CMS-driven (hero, timeline events, champions, factory essay images, oral histories, serial-year data); ~45% hard-coded (all intro CTAs, serial UI copy, related links, final CTA, headings/backgrounds).
- Biggest impact changes: (1) move all intro/CTA sections to Sanity, (2) CMS-ify final CTA and related links, (3) expose serial lookup UI copy to editors, (4) CMS-enable factory intro text and Champions Gallery labels/background, (5) optionally allow era backgrounds/labels to be edited. These steps would make the Heritage page largely editor-controlled while preserving existing CMS data for events/champions/oral histories.
