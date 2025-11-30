# Sanity Content Audit – Service

## Overview
- Audited the Service page (`src/app/service/page.tsx`) to map which visible UI is Sanity-driven vs hard-coded.
- Followed data from `getServicePageData` (Sanity serviceHome + recommended centers, merged with fixtures) through hero, overview, guidance blocks, network finder, maintenance/parts sections, requests, downloads, FAQ, and final CTA.

## Route & Files Scanned
- `src/app/service/page.tsx`
- Data loader: `src/lib/service-data.ts`
- Sanity queries: `src/sanity/queries/service.ts` (`serviceHome`, `recommendedServiceCenter`)
- Sanity schemas: `sanity/schemas/documents/{serviceHome.ts,recommendedServiceCenter.ts}`
- Fallback content: `src/content/service/{hero.ts,overview.ts,locations.ts,guides.ts,parts.ts,faq.ts,cta.ts}`
- Components:
  - `src/components/service/ServiceHero.tsx`
  - `src/components/service/ServiceOverview.tsx`
  - `src/components/service/ServiceNetworkFinder.tsx`
  - `src/components/service/MaintenanceRepairs.tsx`
  - `src/components/service/PartsEditorial.tsx`
  - `src/components/service/IntegrityAdvisory.tsx`
  - `src/components/service/ServiceRequest.tsx`
  - `src/components/service/PartsRequest.tsx`
  - `src/components/service/CareGuidesDownloads.tsx`
  - `src/components/service/FAQList.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Inline ChatTrigger sections in route

## Summary of Content Sources
- Roughly 50–55% CMS-driven: hero media/title/subheading and recommended service center locations come from Sanity; everything else uses hard-coded fixtures.
- Roughly 45–50% hard-coded: overview copy, guidance blocks, maintenance/parts copy, integrity advisory, service/parts request text, downloads, FAQs, CTA text/labels, and all headings/labels/buttons.
- Page is lightly CMS-enabled (hero + locations). Most narrative, prompts, and CTAs require code changes.

## Detailed Findings by Section

### Service Hero — `src/components/service/ServiceHero.tsx`
- Background image/alt, title, subheading → **Sanity CMS** `serviceHome.hero.{title,subheading,background}`; fallback `src/content/service/hero.ts`.
- Eyebrow “Service” and breadcrumbs (“Home”, “Service”) → **Hard-coded** in component/route.

### Service Overview — `src/components/service/ServiceOverview.tsx`
- Intro HTML and checks list → **Hard-coded** `src/content/service/overview.ts` (not fetched from Sanity).
- Section headings/labels (“Overview”, “Factory-level care…”, “Standard checks”) → **Hard-coded**.

### Service Guidance (ChatTrigger) — inline in route
- Eyebrow “Service guidance”, paragraph, ChatTrigger label/payload → **Hard-coded** in `src/app/service/page.tsx`.

### Service Network Finder — `src/components/service/ServiceNetworkFinder.tsx`
- Location cards (name, address, city/state, phone, contact) → **Sanity CMS** `recommendedServiceCenter` docs via `getRecommendedServiceCenters`; fallback `src/content/service/locations.ts`.
- Section headings/labels/buttons inside component → **Hard-coded** (component not shown but label text is static).

### Maintenance & Repairs — `src/components/service/MaintenanceRepairs.tsx`
- Copy/labels use `overview` data (hard-coded from `overview.ts`) and first guide from `maintenanceGuides` (hard-coded from `guides.ts`) → **Hard-coded**.
- Section headings within component → **Hard-coded**.

### Parts Editorial — `src/components/service/PartsEditorial.tsx`
- Parts list (name, purpose, fitment, notesHtml) → **Hard-coded** `src/content/service/parts.ts`.
- Section headings/labels → **Hard-coded**.

### Integrity Advisory — `src/components/service/IntegrityAdvisory.tsx`
- All text → **Hard-coded** in component.

### Service Request — `src/components/service/ServiceRequest.tsx`
- Title/description/button label, embed/fallback URLs → **Hard-coded** in route constants (`SERVICE_REQUEST_EMBED`) and props in `page.tsx`.

### Shipping Prep (ChatTrigger) — inline in route
- Eyebrow “Shipping prep”, paragraph, ChatTrigger label/payload → **Hard-coded** in `page.tsx`.

### Parts Request — `src/components/service/PartsRequest.tsx`
- Embed/fallback URLs → **Hard-coded** constants (`PARTS_REQUEST_EMBED`) in route.
- Any labels within component → **Hard-coded**.

### Care Guides / Downloads — `src/components/service/CareGuidesDownloads.tsx`
- Guides list (title, summaryHtml, file URL/size) → **Hard-coded** `src/content/service/guides.ts`.
- Section heading/labels → **Hard-coded**.

### FAQ List — `src/components/service/FAQList.tsx`
- Questions/answers → **Hard-coded** `src/content/service/faq.ts`.
- FAQ schema JSON-LD is generated from these hard-coded items.

### Final CTA — `src/components/shotguns/CTASection.tsx`
- Body text and primary/secondary labels/hrefs → **Hard-coded**: text in route; links/labels from `src/content/service/cta.ts`.
- Heading “Begin your fitting” → **Hard-coded** in component.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payload questions → **Hard-coded** at call sites (guidance/shipping); component is generic UI.

### Data Fetch & Mapping
- `getServicePageData` fetches Sanity `serviceHome` (hero) and `recommendedServiceCenter` docs; merges into cloned fixture `serviceData`. All other fields (overview, guides, parts, FAQ, CTA) remain fixtures.

## Migration Recommendations
- High: Add CMS fields for service overview (intro/checks), maintenance guides, parts editorial, integrity advisory, and FAQ so editors can update service guidance without code changes.
- High: Move service/parts request copy, embed URLs, and final CTA text/links into Sanity (serviceHome extension or separate settings/CTA doc).
- Medium: CMS-ify chat guidance/shipping prep blocks (eyebrow, body, payloads) for concierge tuning.
- Medium: Allow Care Guides/Downloads to be managed in Sanity (title, summary, file URL/size).
- Low: Externalize headings/labels (Overview, Standard checks, Service guidance, etc.) into translations or CMS for copy flexibility.

## Conclusion
- Estimated CMS vs hard-coded: ~50–55% CMS (hero + service center locations) vs ~45–50% hard-coded (most copy, guides, parts, FAQs, CTAs, chat prompts).
- Most impactful changes: (1) CMS-ify overview/guides/parts/FAQ content, (2) manage service/parts request and final CTA copy/links in Sanity, (3) move guidance/shipping chat blocks into CMS, (4) add CMS-driven downloads, (5) consider CMS/i18n for section labels to reduce code edits. 
