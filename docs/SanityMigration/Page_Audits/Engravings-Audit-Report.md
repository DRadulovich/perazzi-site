# Sanity Content Audit – Engravings

## Overview
- Audited the Engraving Search page (`src/app/engravings/page.tsx`) to identify which UI is Sanity-driven vs hard-coded.
- Traced data from the GROQ `engravingsQuery` (Sanity `engravings` docs) through the hero and the `EngravingSearchTable` (filters, cards, favorites/compare, modals).

## Route & Files Scanned
- `src/app/engravings/page.tsx`
- Query/schema: `engravingsQuery` in route; `sanity/schemas/documents/engravings.ts?` (not shown here but implied by query)
- Components: `src/components/engravings/EngravingSearchTable.tsx`
- Assets: `Photos/ENGRAVINGS/p-web-d-2.jpg` (hero background)

## Summary of Content Sources
- ~75% CMS-driven: engraving records (ID, side, grade, image/alt) from Sanity `engravings` docs via page-level GROQ query.
- ~25% hard-coded: hero copy/image, table/filter labels, button text, headings, favorites/compare UX strings, and empty-state copy.
- Page is data-rich from Sanity but surrounding narrative/UX copy is code-managed.

## Detailed Findings by Section

### Hero Banner — `src/app/engravings/page.tsx`
- Eyebrow “Engraving Search,” heading “The Perazzi Engraving Library,” descriptive paragraph, background image `Photos/ENGRAVINGS/p-web-d-2.jpg` → **Hard-coded** in route.

### Engraving Query & Mapping — `src/app/engravings/page.tsx`
- CMS data fetched from **Sanity** `engravings` docs: `engraving_id`, `engraving_side`, `engraving_grade->name`, `engraving_photo.asset/alt`. Data filtered and defaulted in code to build `engravings` array → **CMS values** with **Hard-coded** transformation.

### EngravingSearchTable — `src/components/engravings/EngravingSearchTable.tsx`
- Card content: engraving ID, side, grade, image/alt → **Sanity CMS** via query results.
- Filters: options derived from CMS data; labels (“Search”, “Grade”, “Side”, “Reset filters”, “Showing X of Y”) → **Hard-coded**.
- Buttons/labels: “Save/Saved”, “View details”, “Compare”, “Favorites”, “Prev/Next”, modal close, empty-state text → **Hard-coded**.
- Favorites/compare functionality and UI strings → **Hard-coded** logic/text.
- Modal imagery uses CMS image (`engraving_photo`) via `getSanityImageUrl`; alt falls back to code if missing.

## Migration Recommendations
- High: Move hero copy/image into Sanity (engraving landing singleton or settings doc) to avoid code edits for marketing updates.
- Medium: Externalize UI labels/buttons/empty states (search/filter headings, save/view/compare text) to i18n or a CMS settings doc.
- Medium: Add optional CMS-managed intro/help or CTA block to guide users and surface related content.
- Low: Consider exposing favorites/compare limit text and “No engravings match…” copy to CMS/i18n for wording tweaks.

## Conclusion
- Estimated CMS vs hard-coded: ~75% CMS-driven (engraving data and imagery) vs ~25% hard-coded (hero content, UI labels/buttons, helper text).
- Top improvements: (1) CMS-ify hero content/media, (2) externalize table/filter/favorites copy, (3) add CMS-driven intro/CTA/help, (4) optionally manage modal/empty-state text in CMS/i18n for flexibility.
