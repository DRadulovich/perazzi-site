# Sanity Content Audit – HT

## Overview
- Audited the High Tech platform page (`src/app/shotguns/ht/page.tsx`) to determine which visible UI is powered by Sanity vs hard-coded.
- Traced data from `getShotgunsSectionData` (platform + disciplines + series) through all rendered sections (hero, at-a-glance, story, highlights, discipline map, champion marquee, related list, CTA, and inline platform guidance).

## Route & Files Scanned
- `src/app/shotguns/ht/page.tsx`
- Data pipeline: `src/lib/shotguns-data.ts`, `src/lib/platform-series.ts`, `src/content/shotguns/series.ht.ts` (fallback)
- Sanity queries: `src/sanity/queries/shotguns.ts`
- Sanity schemas: `sanity/schemas/documents/{platform.ts,discipline.ts,grade.ts,shotgunsLanding.ts}`
- Components:
  - `src/components/shotguns/SeriesHero.tsx`
  - `src/components/shotguns/AtAGlanceStrip.tsx`
  - `src/components/shotguns/SeriesStory.tsx`
  - `src/components/shotguns/EngHighlightsGrid.tsx`
  - `src/components/shotguns/DisciplineMap.tsx`
  - `src/components/shotguns/MarqueeFeature.tsx`
  - `src/components/shotguns/RelatedList.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Inline platform guidance block (ChatTrigger) in route
  - `src/components/chat/ChatTriggerButton.tsx`

## Summary of Content Sources
- Roughly 70% of primary content is CMS-driven from Sanity platform data (hero media/title, highlights, champion, discipline refs) and discipline docs, with hard-coded fixtures as fallbacks.
- About 30% is hard-coded: platform guidance block, CTA text/labels, section headings/labels, related articles list (from code fixtures), chat prompt text, and “At a glance” labels.
- Page is fairly CMS-editable for core platform narrative but still relies on code for CTAs, guidance prompts, and related/CTA content.

## Detailed Findings by Section

### Series Hero — `src/components/shotguns/SeriesHero.tsx`
- Title/subheading, hero image/alt/aspect → **Sanity CMS** via `platformToSeriesEntry` using `platform` doc (`name`, `tagline`, `hero`) from `getPlatforms`; fallback `src/content/shotguns/series.ht.ts` hero if missing.
- Eyebrow “Perazzi series” text → **Hard-coded** in component.

### Platform Guidance Block — inline in `src/app/shotguns/ht/page.tsx`
- Eyebrow “Platform guidance”, sentence “Questions about the High Tech Platform? Ask Perazzi.”, ChatTrigger label/payload → **Hard-coded** in route.

### At a Glance — `src/components/shotguns/AtAGlanceStrip.tsx`
- Trigger type, weight distribution, typical disciplines values → **Sanity CMS** from `platform` doc (`detachableCounterpart`/`fixedCounterpart` names, `weightDistribution`, `disciplines`) mapped via `platformToSeriesEntry`; fallback `series.ht.ts` values.
- Link list: only `Explore {platform.name}` from CMS (built in `platformToSeriesEntry`); fallback links from `series.ht.ts` are overridden. → **CMS-derived** label/href per platform slug/name.
- Section heading “At a glance” and label text (“Trigger type”, etc.) → **Hard-coded** in component.

### Series Story — `src/components/shotguns/SeriesStory.tsx`
- Story HTML → **Sanity CMS** `platform.lineage` (rich text string) mapped to HTML; fallback `series.ht.ts` storyHtml if absent.

### Engineering Highlights — `src/components/shotguns/EngHighlightsGrid.tsx`
- Highlight titles/bodies/media (image alt/url/aspect) → **Sanity CMS** `platform.highlights[]` (`title`, `body`, `media`) via `getPlatforms`; fallback highlights from `series.ht.ts` if missing.
- Section heading “Engineering highlights” → **Hard-coded**.

### Discipline Pairing — `src/components/shotguns/DisciplineMap.tsx`
- Discipline chips (label, rationale, href) → **Sanity CMS** from `platform.disciplines` references + mapped text from `discipline` docs (`overview` -> rationale) via `platformToSeriesEntry`/`buildDisciplineMap`; fallback `series.ht.ts.disciplineMap` if refs absent.
- Section heading “Discipline pairing” → **Hard-coded**.

### Champion Marquee — `src/components/shotguns/MarqueeFeature.tsx`
- Champion name/title/quote/image/href → **Sanity CMS** `platform.champion` fields (schema `platform.champion.{name,title,quote,image}`) via `getPlatforms`; fallback champion from `series.ht.ts` if missing.
- Eyebrow “Champion spotlight” and CTA “Meet the champions” text → **Hard-coded** in component.
- If no champion, fallback heading/body text → **Hard-coded**.

### Related Reading — `src/components/shotguns/RelatedList.tsx`
- Related article titles/slugs → **Hard-coded fixtures** from `src/content/shotguns/series.ht.ts` (`relatedArticles`) because `platformToSeriesEntry` passes through fallback only; not sourced from Sanity.
- Section heading “Related reading” → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx` (invoked in route)
- Heading “Begin your fitting” → **Hard-coded** in component.
- Body text + primary/secondary labels/hrefs → **Hard-coded** in route (`src/app/shotguns/ht/page.tsx`).

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payloads (platform guidance) → **Hard-coded** at call site; component is generic UI.

### Data Fetch & Mapping
- `src/lib/shotguns-data.ts` fetches Sanity `platform`, `discipline` docs via `getPlatforms`, `getDisciplines` (`src/sanity/queries/shotguns.ts`). It clones fixture `shotgunsData` and applies CMS content; missing CMS fields fall back to `src/content/shotguns/series.ht.ts` and related fixtures.
- Platform schema fields used: `name`, `slug`, `lineage`, `hero`, `highlights[]`, `champion.{name,title,quote,image}`, `disciplines` references, `fixedCounterpart`, `detachableCounterpart`, `weightDistribution`.
- Discipline schema fields: `name`, `slug`, `overview`, `hero`, `championImage`, `recommendedPlatforms`, `popularModels`.

## Migration Recommendations
- High: Move platform guidance block copy and chat prompt into Sanity (e.g., a `platform` subobject or `shotgunsLanding` CTA) so editors can adjust messaging.
- High: Make final CTA text/labels/hrefs CMS-managed per platform (or a reusable CTA doc) instead of hard-coded in the route.
- Medium: Allow related articles list to come from Sanity (reference array on `platform` or `shotgunsLanding`) to avoid code edits.
- Medium: Externalize section headings/eyebrows (“At a glance,” “Engineering highlights,” “Discipline pairing,” “Champion spotlight,” hero eyebrow) into CMS or translations for flexibility.
- Low: Consider making ChatTrigger payloads editable for concierge tuning.

## Conclusion
- Estimated CMS-editable vs hard-coded: ~70% CMS-driven (hero, story, highlights, champion, discipline map, at-a-glance values) vs ~30% hard-coded (guidance copy, CTAs, related list, labels/eyebrows, chat prompts).
- Most impactful changes: (1) CMS-ify platform guidance + CTA content, (2) source related articles from Sanity, (3) make section headings/eyebrows configurable, (4) allow chat prompt text to be edited, (5) ensure platform-related CTAs/links are Sanity-managed for HT and other platform pages.
