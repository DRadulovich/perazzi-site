# Sanity Content Audit – Grades

## Overview
- Audited the Shotguns Grades page (`src/app/shotguns/grades/page.tsx`) to map which visible UI is Sanity-driven vs hard-coded.
- Traced data flow from `getShotgunsSectionData` (grades fetched from Sanity then merged with fixtures) through hero, provenance note, grade sections (gallery, provenance note, options), wood carousel, process note, and final CTA.

## Route & Files Scanned
- `src/app/shotguns/grades/page.tsx`
- Data/fallbacks: `src/content/shotguns/grades-content.ts`, `src/content/shotguns/grades.ts`
- Data loader: `src/lib/shotguns-data.ts` (applyGrades)
- Sanity query: `src/sanity/queries/shotguns.ts` (gradesQuery)
- Sanity schema: `sanity/schemas/grade.ts` (fields: name, description, hero, engravingGallery, woodImages)
- Components:
  - `src/components/shotguns/GradesHero.tsx`
  - `src/components/shotguns/EngravingGallery.tsx`
  - `src/components/shotguns/WoodCarousel.tsx`
  - `src/components/shotguns/ProvenanceNote.tsx`
  - `src/components/shotguns/OptionsGrid.tsx`
  - `src/components/shotguns/ProcessNote.tsx`
  - `src/components/shotguns/CTASection.tsx`

## Summary of Content Sources
- Approx. 55% CMS-driven: grade names/descriptions and galleries (hero/engraving/wood) come from Sanity `grade` docs when present.
- Approx. 45% hard-coded: hero headline/subheading/background, provenance copy, process note, commission options, CTA text/labels, section headings/labels, chatless page.
- Page is moderately CMS-editable: imagery and summaries update from Sanity, but most narrative/CTA/provenance/option text is fixed in code.

## Detailed Findings by Section

### Hero — `src/components/shotguns/GradesHero.tsx`
- Title “Grades & custom artistry”, subheading, background image/alt → **Hard-coded** (`src/content/shotguns/grades-content.ts:1-12`).
- Eyebrow none; component labels are minimal and static.

### Provenance Intro — `src/components/shotguns/ProvenanceNote.tsx`
- Rich text about engraving provenance → **Hard-coded** (`grades-content.ts:14-16`).

### Grade Sections (loop) — `src/app/shotguns/grades/page.tsx`
- Section title (`grade.name`) and description (`grade.description`) → **Sanity CMS** fields `grade.name`, `grade.description` (schema `grade.ts`) via `applyGrades`, with fallback values from `src/content/shotguns/grades.ts`.
- Gallery images (EngravingGallery) → **Sanity CMS** `grade.hero` + `grade.engravingGallery[]` merged; fallback gallery from `grades.ts`.
- ProvenanceNote per grade (`grade.provenanceHtml`) → **Hard-coded** in `grades.ts` (not in Sanity schema).
- OptionsGrid (`grade.options`) → **Hard-coded** in `grades.ts` (no Sanity fields).
- Section heading styling/text (“Commission options”, gallery heading text) → **Hard-coded** in components.

### Wood Carousel — `src/components/shotguns/WoodCarousel.tsx`
- Uses `grades` gallery assets (prefers second image) → **Sanity CMS** images if provided in `engravingGallery`/`hero`; otherwise fixtures.
- Carousel headings/controls (“Wood sets & embellishments”, Prev/Next labels) → **Hard-coded** in component.

### Process Note — `src/components/shotguns/ProcessNote.tsx`
- Title “Commission cadence”, HTML list/timelines → **Hard-coded** (`grades-content.ts:18-27`).
- Eyebrow/heading label → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx` (invoked in route)
- Heading “Begin your fitting” → **Hard-coded** in component.
- Body text and button labels/hrefs → **Hard-coded** in route (`src/app/shotguns/grades/page.tsx`:35-40).

## Migration Recommendations
- High: Move hero content (title, subheading, background) into a Sanity “grades landing” singleton or extend `grade` schema for landing fields.
- High: CMS-ify provenance intro and per-grade provenance text/options so editors can adjust narratives and offerings.
- High: Make final CTA body/labels/hrefs editable in Sanity (shared CTA doc or landing singleton).
- Medium: Externalize Process Note title/body into Sanity for commissioning timeline updates.
- Low: Allow section headings/labels (gallery/wood/options) to come from CMS or translations if copy changes are expected.

## Conclusion
- Estimated CMS vs hard-coded: ~55% CMS (grade names/descriptions/galleries) vs ~45% hard-coded (hero, provenance copy, options, process note, CTA, labels).
- Top improvements: (1) Add a grades landing doc for hero/provenance/process/CTA, (2) store per-grade provenance/options in Sanity, (3) expose CTA content to editors, (4) make headings/labels configurable for copy flexibility. 
