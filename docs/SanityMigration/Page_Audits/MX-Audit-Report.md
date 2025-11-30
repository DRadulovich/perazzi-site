# Sanity Content Audit – MX

## Overview
- Audited the MX platform page (`src/app/shotguns/mx/page.tsx`) to map which visible UI is Sanity-driven vs hard-coded.
- Followed data from `getShotgunsSectionData` (platform + disciplines + series) through all rendered sections: hero, platform guidance, at-a-glance, story, engineering highlights, discipline map, champion marquee, related list, and final CTA.

## Route & Files Scanned
- `src/app/shotguns/mx/page.tsx`
- Data pipeline: `src/lib/shotguns-data.ts`, `src/lib/platform-series.ts`, `src/content/shotguns/series.mx.ts` (fallback)
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
  - Inline platform guidance (ChatTrigger) in route
  - `src/components/chat/ChatTriggerButton.tsx`

## Summary of Content Sources
- Roughly 70% of primary content is sourced from Sanity platform + discipline data (hero media/title, highlights, champion, discipline mapping, story) with code fallbacks.
- About 30% is hard-coded: platform guidance block, final CTA copy/labels, section headings/eyebrows, related articles, chat prompt text, and some label text.
- The page is largely CMS-editable for core MX narrative, but CTAs, prompts, and related content still require code changes.

## Detailed Findings by Section

### Series Hero — `src/components/shotguns/SeriesHero.tsx`
- Title/subheading, hero image/alt/aspect → **Sanity CMS** from `platform` doc (`name`, `tagline`, `hero`) via `getPlatforms` mapped through `platformToSeriesEntry`; fallback `src/content/shotguns/series.mx.ts` hero.
- Eyebrow “Perazzi series” → **Hard-coded** in component.

### Platform Guidance Block — inline in `src/app/shotguns/mx/page.tsx`
- Eyebrow “Platform guidance,” sentence “Questions about the MX Platform? Ask Perazzi.”, ChatTrigger label/payload → **Hard-coded** in route.

### At a Glance — `src/components/shotguns/AtAGlanceStrip.tsx`
- Trigger type (built from detachable/fixed counterparts), weight distribution, typical disciplines values → **Sanity CMS** `platform` fields (`detachableCounterpart`/`fixedCounterpart`, `weightDistribution`, `disciplines`) mapped via `platformToSeriesEntry`; fallback `series.mx.ts`.
- Links array: `Explore {platform.name}` (CMS-derived slug/name) replacing fallback links.
- Heading “At a glance” and label text (“Trigger type,” etc.) → **Hard-coded** in component.

### Series Story — `src/components/shotguns/SeriesStory.tsx`
- Story HTML → **Sanity CMS** `platform.lineage` string (converted to HTML) via `platformToSeriesEntry`; fallback `series.mx.ts.storyHtml`.

### Engineering Highlights — `src/components/shotguns/EngHighlightsGrid.tsx`
- Highlight titles/bodies/media → **Sanity CMS** `platform.highlights[]` (`title`, `body`, `media`) from `getPlatforms`; fallback `series.mx.ts.highlights`.
- Section heading “Engineering highlights” → **Hard-coded**.

### Discipline Pairing — `src/components/shotguns/DisciplineMap.tsx`
- Discipline chips (label, rationale, href) → **Sanity CMS** from `platform.disciplines` references combined with `discipline` docs (`overview` → rationale) via `platformToSeriesEntry`/`buildDisciplineMap`; fallback `series.mx.ts.disciplineMap` if refs absent.
- Heading “Discipline pairing” → **Hard-coded**.

### Champion Marquee — `src/components/shotguns/MarqueeFeature.tsx`
- Champion name/title/quote/image/href → **Sanity CMS** `platform.champion.{name,title,quote,image}` via `getPlatforms`; fallback champion from `series.mx.ts`.
- Eyebrow “Champion spotlight” and CTA “Meet the champions” → **Hard-coded** in component; fallback text if no champion also hard-coded.

### Related Reading — `src/components/shotguns/RelatedList.tsx`
- Related article titles/slugs → **Hard-coded fixtures** from `src/content/shotguns/series.mx.ts.relatedArticles`; not sourced from Sanity.
- Heading “Related reading” → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx` (used in route)
- Heading “Begin your fitting” → **Hard-coded** in component.
- Body text and button labels/hrefs → **Hard-coded** in route (`src/app/shotguns/mx/page.tsx`).

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payloads for platform guidance → **Hard-coded** at call site; component is generic UI only.

### Data Fetch & Mapping
- `src/lib/shotguns-data.ts` fetches Sanity `platform` and `discipline` docs via `getPlatforms`/`getDisciplines` (`src/sanity/queries/shotguns.ts`). It clones fixture `shotgunsData` and applies CMS content; missing data falls back to `src/content/shotguns/series.mx.ts`.
- Platform schema fields used: `name`, `slug`, `lineage`, `hero`, `highlights[]`, `champion`, `disciplines`, `fixedCounterpart`, `detachableCounterpart`, `weightDistribution`.
- Discipline schema fields: `name`, `slug`, `overview`, `hero`, `championImage`, `recommendedPlatforms`, `popularModels`.

## Migration Recommendations
- High: CMS-ify the platform guidance block and chat prompt so editors can adjust MX messaging without code changes.
- High: Move final CTA body text and labels/hrefs into Sanity (per-platform CTA or shared CTA doc).
- Medium: Allow related articles to come from Sanity (reference array on `platform` or shared content list).
- Medium: Externalize section headings/eyebrows (“At a glance,” “Engineering highlights,” “Discipline pairing,” “Champion spotlight,” hero eyebrow) into Sanity or translations.
- Low: Consider making ChatTrigger payload text editable for concierge tuning.

## Conclusion
- Estimated CMS vs hard-coded: ~70% CMS-driven (hero, story, highlights, champion, discipline mapping, at-a-glance values) vs ~30% hard-coded (guidance copy, CTA copy/labels, related list, labels/eyebrows, chat prompts).
- Most impactful improvements: (1) Put guidance + CTA copy into Sanity, (2) source related reading from CMS, (3) make section headings/eyebrows configurable, (4) allow chat prompt text to be edited, (5) ensure platform-specific CTAs/links are CMS-managed across platform pages.
