# Sanity Content Audit – TM

## Overview
- Audited the TM platform page (`src/app/shotguns/tm/page.tsx`) to map which visible UI is driven by Sanity vs hard-coded.
- Followed data from `getShotgunsSectionData` (platform + disciplines + series) through rendered sections: hero, platform guidance, at-a-glance, story, engineering highlights, discipline map, champion marquee, related list, and final CTA.

## Route & Files Scanned
- `src/app/shotguns/tm/page.tsx`
- Data pipeline: `src/lib/shotguns-data.ts`, `src/lib/platform-series.ts`, fallback `src/content/shotguns/series.tm.ts`
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
- Roughly 70% CMS-driven (hero media/title, story, highlights, champion, discipline mapping, at-a-glance values) from Sanity `platform`/`discipline` docs; fixtures fill gaps.
- About 30% hard-coded: platform guidance block, final CTA copy/labels, section headings/eyebrows, related articles, chat prompt text, and label copy.
- Core TM narrative is CMS-editable, but CTAs, prompts, and related content remain code-managed.

## Detailed Findings by Section

### Series Hero — `src/components/shotguns/SeriesHero.tsx`
- Title/subheading, hero image/alt/aspect → **Sanity CMS** `platform.{name,tagline,hero}` via `getPlatforms`/`platformToSeriesEntry`; fallback `src/content/shotguns/series.tm.ts`.
- Eyebrow “Perazzi series” → **Hard-coded**.

### Platform Guidance — inline in `src/app/shotguns/tm/page.tsx`
- Eyebrow “Platform guidance,” line “Questions about the TM Platform? Ask Perazzi.”, ChatTrigger label/payload → **Hard-coded** in route.

### At a Glance — `src/components/shotguns/AtAGlanceStrip.tsx`
- Trigger type (from counterparts), weight distribution, typical disciplines → **Sanity CMS** `platform` fields (`detachableCounterpart`/`fixedCounterpart`, `weightDistribution`, `disciplines`) mapped via `platformToSeriesEntry`; fallback `series.tm.ts`.
- Links: generated `Explore {platform.name}` (CMS-derived). Heading/labels (“At a glance,” “Trigger type,” etc.) → **Hard-coded**.

### Series Story — `src/components/shotguns/SeriesStory.tsx`
- Story HTML → **Sanity CMS** `platform.lineage` string to HTML via `platformToSeriesEntry`; fallback `series.tm.ts.storyHtml`.

### Engineering Highlights — `src/components/shotguns/EngHighlightsGrid.tsx`
- Highlight titles/bodies/media → **Sanity CMS** `platform.highlights[]` via `getPlatforms`; fallback `series.tm.ts.highlights`.
- Section heading “Engineering highlights” → **Hard-coded**.

### Discipline Pairing — `src/components/shotguns/DisciplineMap.tsx`
- Discipline chips (label, rationale, href) → **Sanity CMS** from `platform.disciplines` references + `discipline` docs (`overview` → rationale) via `platformToSeriesEntry`/`buildDisciplineMap`; fallback `series.tm.ts.disciplineMap`.
- Heading “Discipline pairing” → **Hard-coded**.

### Champion Marquee — `src/components/shotguns/MarqueeFeature.tsx`
- Champion name/title/quote/image/href → **Sanity CMS** `platform.champion` fields; fallback champion from `series.tm.ts`.
- Eyebrow “Champion spotlight,” CTA “Meet the champions,” and fallback text → **Hard-coded** in component.

### Related Reading — `src/components/shotguns/RelatedList.tsx`
- Related articles list → **Hard-coded fixtures** `series.tm.ts.relatedArticles`; not sourced from Sanity.
- Heading “Related reading” → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx` (used in route)
- Heading “Begin your fitting” → **Hard-coded** in component.
- Body text and button labels/hrefs → **Hard-coded** in route.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payloads for guidance → **Hard-coded** at call site; component is generic UI.

### Data Fetch & Mapping
- `src/lib/shotguns-data.ts` fetches `platform` and `discipline` docs via `getPlatforms`/`getDisciplines` (`src/sanity/queries/shotguns.ts`), applies into fixture `shotgunsData`; missing CMS data falls back to `src/content/shotguns/series.tm.ts`.
- Platform schema fields used: `name`, `slug`, `lineage`, `hero`, `highlights[]`, `champion`, `disciplines`, `fixedCounterpart`, `detachableCounterpart`, `weightDistribution`.
- Discipline schema fields: `name`, `slug`, `overview`, `hero`, `championImage`, `recommendedPlatforms`, `popularModels`.

## Migration Recommendations
- High: CMS-ify platform guidance copy and chat prompt for TM (and other platform pages).
- High: Move final CTA body/labels/hrefs into Sanity (per-platform CTA or shared CTA doc).
- Medium: Allow related articles to be sourced from Sanity (platform-level references).
- Medium: Externalize section headings/eyebrows (“At a glance,” “Engineering highlights,” “Discipline pairing,” “Champion spotlight,” hero eyebrow) into CMS or translations.
- Low: Consider making ChatTrigger payload text editor-controlled for concierge tuning.

## Conclusion
- Estimated CMS vs hard-coded: ~70% CMS-driven (hero, story, highlights, champion, discipline mapping, at-a-glance values) vs ~30% hard-coded (guidance copy, CTA copy/labels, related list, headings/eyebrows, chat prompts).
- Most impactful changes: (1) Put guidance + CTA copy into Sanity, (2) source related reading from CMS, (3) make section headings/eyebrows configurable, (4) allow chat prompt text to be edited, (5) ensure platform-specific CTAs/links are CMS-managed across platform pages.
