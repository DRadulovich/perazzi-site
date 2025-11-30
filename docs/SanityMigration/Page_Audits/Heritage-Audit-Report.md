# Sanity Content Audit – Heritage

## Overview
- Audited the Heritage page (`src/app/heritage/page.tsx`) to determine which visible UI is CMS-driven via Sanity vs hard-coded.
- Followed data from `getHeritagePageData` (heritageHome, heritageEvent, champion queries + fallbacks) through hero, eras/timeline, chat guidance, serial lookup, cinematic strips, champions gallery, photo essay, oral histories, related list, and final CTA.

## Route & Files Scanned
- `src/app/heritage/page.tsx`
- Data loader: `src/lib/heritage-data.ts`
- Sanity queries: `src/sanity/queries/heritage.ts` (heritageHome, heritageEvent, champion)
- Sanity schemas: `sanity/schemas/documents/{heritageHome.ts,heritageEvent.ts,champion.ts,manufactureYear.ts}`
- Fallback content: `src/content/heritage/{hero.ts,timeline.ts,champions.ts,factoryEssay.ts,factoryIntro.ts,oralHistories.ts,related.ts,finalCta.ts}`
- Components:
  - `src/components/heritage/HeritageHero.tsx`
  - `src/components/heritage/PerazziHeritageEras.tsx` (timeline/eras display)
  - `src/components/chat/ChatTriggerButton.tsx` (inline “Ask the workshop” block)
  - `src/components/heritage/SerialLookup.tsx`
  - `src/components/shotguns/CinematicImageStrip.tsx`
  - `src/components/heritage/ChampionsGallery.tsx`
  - `src/components/heritage/FactoryPhotoEssay.tsx`
  - `src/components/heritage/OralHistories.tsx`
  - `src/components/shotguns/RelatedList.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Utility: `src/utils/heritage/groupEventsByEra.ts`

## Summary of Content Sources
- Approx. 60–65% CMS-driven: hero media/title, timeline/era events, champion profiles, photo essay images, oral histories, and serial lookup results all come from Sanity documents (with fallbacks).
- Approx. 35–40% hard-coded: chat guidance block, cinematic strip images/alt, serial lookup headings/copy/button labels, related articles list, final CTA text/links, and various section headings/labels.
- Page is reasonably CMS-enabled for core heritage data, but several narrative blocks, CTAs, and helper text remain code-managed.

## Detailed Findings by Section

### Hero — `src/components/heritage/HeritageHero.tsx`
- Title/subheading/background image → **Sanity CMS** `heritageHome.hero.{title,subheading,background}`; fallback `src/content/heritage/hero.ts`.
- Eyebrow “Heritage” and breadcrumbs (“Home”/“Heritage”) → **Hard-coded**.

### Heritage Eras / Timeline — `src/components/heritage/PerazziHeritageEras.tsx` (data grouped in route)
- Event titles, dates, summaries (HTML), media, reference links to champions/platforms → **Sanity CMS** `heritageEvent` docs via `getHeritageEvents`; fallback `src/content/heritage/timeline.ts`.
- Section headings/labels inside the component (era labels, buttons if any) → **Hard-coded**.

### Ask the Workshop (ChatTrigger) — inline in `src/app/heritage/page.tsx`
- Eyebrow “Ask the workshop,” paragraph, ChatTrigger label/payload → **Hard-coded** in route.

### Serial Lookup — `src/components/heritage/SerialLookup.tsx`
- Form labels, headings (“Discover When Your Story Began”), helper/error/success messages, button text → **Hard-coded** in component.
- Lookup result data (year, proof code, range, model) → **Sanity CMS** `manufactureYear` query via `getManufactureYearBySerial`.

### Cinematic Image Strip(s) — `src/components/shotguns/CinematicImageStrip.tsx`
- Images/alt (`/cinematic_background_photos/...`) → **Hard-coded assets** in route.

### Champions Gallery — `src/components/heritage/ChampionsGallery.tsx`
- Champion name/title/quote/image, optional article link → **Sanity CMS** `champion` docs via `getHeritageChampions`; fallback `src/content/heritage/champions.ts`.
- Section labels/CTA text inside component → **Hard-coded**.

### Factory Photo Essay — `src/components/heritage/FactoryPhotoEssay.tsx`
- Photo essay images (id/image) and intro HTML → **Sanity CMS** `heritageHome.photoEssay[]` mapped via `getHeritageHome`; fallback `src/content/heritage/factoryEssay.ts` and intro `factoryIntro.ts`.
- Component headings/labels → **Hard-coded**.

### Oral Histories — `src/components/heritage/OralHistories.tsx`
- Histories (title/quote/attribution/image) → **Sanity CMS** `heritageHome.oralHistories[]`; fallback `src/content/heritage/oralHistories.ts`.
- Section headings/labels → **Hard-coded**.

### Related Reading — `src/components/shotguns/RelatedList.tsx`
- Related article list (title/slug) → **Hard-coded** `src/content/heritage/related.ts` (not from Sanity).
- Heading “Related reading” → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx`
- Body text and primary/secondary labels/hrefs → **Hard-coded** `src/content/heritage/finalCta.ts`.
- CTA heading “Begin your fitting” → **Hard-coded** in component.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payload questions (heritage guidance) → **Hard-coded** at call site; component is generic UI.

### Data Fetch & Mapping
- `getHeritagePageData` pulls Sanity `heritageHome`, `heritageEvent`, `champion` data; merges into cloned fixture `heritageData` for fallbacks.
- Timeline grouped by era via `groupEventsByEra`, using CMS/fallback events.
- Serial lookup server action queries `getManufactureYearBySerial` against Sanity dataset `manufactureYear` (schema not shown here).

## Migration Recommendations
- High: CMS-ify the “Ask the workshop” block (eyebrow, body, chat prompt) and final CTA text/links to avoid code edits.
- High: Move Related Reading list into Sanity (heritageHome or a related content reference array).
- Medium: Allow Serial Lookup headings/helper/error strings to be managed via CMS or i18n for copy flexibility.
- Medium: Expose CinematicImageStrip assets/alt in Sanity or a media settings doc for art direction control.
- Low: Externalize section headings/labels (Heritage, Related reading, etc.) into CMS or translations if copy changes are expected.

## Conclusion
- Estimated CMS vs hard-coded: ~60–65% CMS-driven (hero, timeline/eras, champions, photo essay, oral histories, serial lookup data) vs ~35–40% hard-coded (chat/CTA/related lists, cinematic imagery, serial lookup copy, section labels).
- Most impactful changes: (1) CMS-ify chat guidance and final CTA, (2) source related reading from Sanity, (3) manage serial lookup UX copy in CMS/i18n, (4) make cinematic strip assets editable, (5) consider CMS/i18n for section labels to minimize future code changes. 
