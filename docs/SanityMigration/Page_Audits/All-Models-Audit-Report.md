# Sanity Content Audit – All Models

## Overview
- Audited the Shotguns “All Models” search page (`src/app/shotguns/all/page.tsx`) to identify which UI is CMS-driven vs hard-coded.
- Traced data from the GROQ `modelsQuery` (Sanity `allModels` docs) through the hero and the interactive `ModelSearchTable` (cards, filters, detail modal).

## Route & Files Scanned
- `src/app/shotguns/all/page.tsx`
- Query/schema: `modelsQuery` in route; `sanity/schemas/documents/allModels.ts`
- Components:
  - `src/components/shotguns/ModelSearchTable.tsx`
- Assets/content: `Photos/olympic-medals-1.jpg` (hero background)

## Summary of Content Sources
- Roughly 70% CMS-driven: model rows (names, platform, gauges, grade, trigger/rib specs, images/alt) come from Sanity `allModels` documents via the page-level GROQ query.
- Roughly 30% hard-coded: hero headline/subcopy/image, table headings/labels, filter labels/buttons, modal labels, and the lack of a CMS-managed CTA or helper text.
- Page is data-rich from Sanity but the surrounding narrative/UX copy is entirely code-managed.

## Detailed Findings by Section

### Hero Banner — `src/app/shotguns/all/page.tsx`
- Eyebrow “Model Search”, heading “The Perazzi Shotguns Database”, paragraph describing the database, background image `medalsHero` (`Photos/olympic-medals-1.jpg`) → **Hard-coded** in route (lines ~27-56).

### Model Query & Data Mapping — `src/app/shotguns/all/page.tsx`
- GROQ `modelsQuery` pulls from **Sanity CMS** `allModels` docs: `name`, `baseModel`, `category` (mapped to `use`), `platform->name/slug`, `gauges`, `grade.name`, `image`, `imageFallbackUrl`, `image.alt`, `trigger{type,springs}`, `rib{type,adjustableNotch,heightMm,styles}`.
- Mapping to `models` array is pure code (label casing, defaults) → **CMS data** values; transformation **Hard-coded**.

### Model Search Table — `src/components/shotguns/ModelSearchTable.tsx`
- Cards/showcase content (model name, platform, gauge, trigger/rib details, grade) → **Sanity CMS** from `allModels` query.
- Images: prefers Sanity `image` via `imageWithMeta`; falls back to `imageFallbackUrl` → **Sanity CMS** primary, optional fallback URL.
- Filters: option values/counts derived from CMS data; labels (“Search”, “Platform”, “Gauge”, “Use”, “Trigger”, “Rib”, “Reset filters”) → **Hard-coded**.
- Buttons/labels: “Search”, “Showing X of Y”, “View details”, “Prev/Next”, modal labels (Platform, Use, Gauge, Trigger Type, etc.), empty-state “No models match…” → **Hard-coded**.
- Highlighting and humanization logic → **Hard-coded** formatting.

## Migration Recommendations
- High: Move hero copy (eyebrow, headline, body) and background image into Sanity (landing singleton or settings doc) to avoid code changes for marketing edits.
- Medium: Allow filter/label copy (“Search”, filter group names, button text, empty state) to be managed via i18n or a CMS settings doc.
- Medium: Add an optional CMS-driven intro/help block or CTA beneath the hero to guide users; keep editable in Sanity.
- Low: Expose modal/spec label text in translations/CMS if frequent wording tweaks are expected.

## Conclusion
- Estimated CMS vs hard-coded: ~70% CMS-driven (model data, images, specs) vs ~30% hard-coded (hero content, UI labels/buttons, absence of CMS-managed CTA/help text).
- Top improvements: (1) CMS-ify hero content/media, (2) externalize filter/CTA/empty-state copy, (3) add a CMS-editable guidance/CTA block, (4) optional CMS control for modal/spec labels to reduce code edits for wording changes.
