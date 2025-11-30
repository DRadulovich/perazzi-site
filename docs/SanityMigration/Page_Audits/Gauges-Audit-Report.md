# Sanity Content Audit – Gauges

## Overview
- Audited the Shotguns Gauges page (`src/app/shotguns/gauges/page.tsx`) to identify which visible UI is Sanity-driven vs hard-coded.
- Traced all rendered components (hero, gauge cards, editorial/sidebar, FAQ, CTA) and their data sources.

## Route & Files Scanned
- `src/app/shotguns/gauges/page.tsx`
- Content sources: `src/content/shotguns/gauges-content.ts`, `src/content/shotguns/gauges.ts`
- Components:
  - `src/components/shotguns/GaugeHero.tsx`
  - `src/components/shotguns/GaugeCardGrid.tsx` + `GaugeCard.tsx`
  - `src/components/shotguns/EditorialBlock.tsx`
  - `src/components/shotguns/SidebarNote.tsx`
  - `src/components/shotguns/FAQList.tsx`
  - `src/components/shotguns/CTASection.tsx`
- No Sanity queries or schemas are referenced by this page.

## Summary of Content Sources
- 0% CMS-driven from Sanity. All visible content (hero text/image, gauge data, editorial/sidebar copy, FAQ, CTA text/links) is hard-coded in local content files.
- The page is entirely static; any copy or imagery changes require code edits.

## Detailed Findings by Section

### Hero — `src/components/shotguns/GaugeHero.tsx`
- Title/subheading/background image → **Hard-coded** `src/content/shotguns/gauges-content.ts` (`gaugesHero`).
- Eyebrow “Gauge primer” → **Hard-coded** in component.

### Gauge Cards — `src/components/shotguns/GaugeCardGrid.tsx` / `GaugeCard.tsx`
- Gauge label/description/handling notes, typical disciplines, common barrels, optional FAQ snippets → **Hard-coded** `src/content/shotguns/gauges.ts`.
- Section heading “Gauges & balance” → **Hard-coded** in `GaugeCardGrid.tsx`.

### Editorial + Sidebar — `src/components/shotguns/EditorialBlock.tsx`, `SidebarNote.tsx`
- Editorial HTML and sidebar HTML → **Hard-coded** `src/content/shotguns/gauges-content.ts` (`gaugesEditorialHtml`, `gaugesSidebarHtml`).
- Sidebar title “Pattern & POI” → **Hard-coded** in route.

### FAQ — `src/components/shotguns/FAQList.tsx`
- Questions/answers → **Hard-coded** `src/content/shotguns/gauges-content.ts` (`gaugesFaq`).
- FAQ schema name/id passed from route → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx`
- Body text and primary/secondary labels/hrefs → **Hard-coded** in route.
- CTA heading “Begin your fitting” → **Hard-coded** in `CTASection.tsx`.

### ChatTrigger Buttons
- None on this page.

### Data Fetch & Mapping
- No Sanity data fetching is performed on this page.

## Migration Recommendations
- High: Move hero content (title, subheading, background) into Sanity for marketing control.
- High: Store gauge definitions (label/description/handling notes/disciplines/barrels/FAQs) in Sanity to allow editors to update specs without code changes.
- Medium: CMS-ify editorial/sidebar copy and FAQ entries for easy revisions.
- Medium: Move CTA text/links into Sanity (shared CTA doc or page-specific settings).
- Low: Optional—expose section headings/labels (“Gauge primer”, “Gauges & balance”, sidebar title) to CMS or translations if copy changes are expected.

## Conclusion
- Estimated CMS vs hard-coded: 0% CMS-driven vs 100% hard-coded for this page.
- Most impactful changes: (1) CMS-ify hero, gauge data, and CTA, (2) move editorial/sidebar/FAQ content into Sanity, (3) optionally externalize headings/labels for non-developer edits. 
