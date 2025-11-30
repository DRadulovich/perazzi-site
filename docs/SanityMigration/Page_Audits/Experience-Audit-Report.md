# Sanity Content Audit – Experience

## Overview
- Audited the Experience page (`src/app/experience/page.tsx`) to map all visible UI and determine what is Sanity-driven versus hard-coded.
- Traced data from `getExperiencePageData` (experienceHome query + fixtures) and `getExperienceNetworkData` (scheduled events/dealers/service centers) through hero, chat block, picker, visit section, booking options/scheduler, travel network, mosaic gallery, FAQ injection, and final CTA.

## Route & Files Scanned
- `src/app/experience/page.tsx`
- Data loaders: `src/lib/experience-data.ts`, `src/sanity/queries/experience.ts`
- Sanity schemas: `sanity/schemas/documents/{experienceHome.ts,scheduledEvent.ts?,authorizedDealer.ts?,recommendedServiceCenter.ts}`
- Fallback content: `src/content/experience/{hero.ts,picker.ts,visit.ts,fitting.ts,mosaic.ts,faq.ts,cta.ts,scheduler.ts}`
- Components:
  - `src/components/experience/ExperienceHero.tsx`
  - `src/components/experience/ExperiencePicker.tsx`
  - `src/components/experience/VisitFactory.tsx`
  - `src/components/experience/BookingOptions.tsx`
  - `src/components/experience/TravelNetwork.tsx`
  - `src/components/experience/MosaicGallery.tsx`
  - `src/components/experience/FAQList.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Inline chat section (`ChatTriggerButton`) in route

## Summary of Content Sources
- Roughly 55–60% CMS-driven: hero media/title, picker items, mosaic assets, and travel network data (events/dealers/service centers) come from Sanity `experienceHome` and related docs.
- Roughly 40–45% hard-coded: visit/booking/FAQ/CTA copy, fitting options, scheduler URLs, chat prompts, section headings/background images, and CTA text/links remain in code fixtures.
- The page is moderately CMS-editable for imagery and card data, but key narrative/CTA/FAQ content is static.

## Detailed Findings by Section

### Hero — `src/components/experience/ExperienceHero.tsx`
- Title/subheading/background image → **Sanity CMS** `experienceHome.hero.{title,subheading,background}`; fallback `src/content/experience/hero.ts`.
- Eyebrow “Experience” and breadcrumbs (“Home”/“Experience”) → **Hard-coded**.

### Visit Planning Chat — inline in `src/app/experience/page.tsx`
- Eyebrow “Visit planning,” paragraph, ChatTrigger label/payload → **Hard-coded** in route.

### Experience Picker — `src/components/experience/ExperiencePicker.tsx`
- Card titles/summaries/media/hrefs/cta labels → **Sanity CMS** `experienceHome.picker[]` with fallback `src/content/experience/picker.ts`.
- Background image `/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg`, section headings (“Choose your path”, “Visit, fit, or demo…”) → **Hard-coded** in component.
- Embedded FAQ (if provided) uses `faq` data from fixtures (see below).

### Visit Factory — `src/components/experience/VisitFactory.tsx`
- All copy (intro, location info, what to expect, CTA label/href) → **Hard-coded** `src/content/experience/visit.ts`.
- Any headings within component → **Hard-coded**.

### Booking Options & Scheduler — `src/components/experience/BookingOptions.tsx`
- Fitting options (title/duration/description/href) → **Hard-coded** `src/content/experience/fitting.ts`.
- Scheduler title/src/fallback → **Hard-coded** `src/content/experience/scheduler.ts`.
- Section headings/labels/background image `/redesign-photos/experience/pweb-experience-bookingoptions-bg.jpg`, button text (“Reserve this session”, “Begin Your Fitting”, “Schedule with concierge”) → **Hard-coded**.

### Travel Network — `src/components/experience/TravelNetwork.tsx`
- Scheduled events, dealers, service centers → **Sanity CMS** from `scheduledEvent`, `authorizedDealer`, `recommendedServiceCenter` via `getExperienceNetworkData`; fallback behavior not shown (uses empty lists if none).
- Section headings/labels/buttons inside component → **Hard-coded**.

### Mosaic Gallery — `src/components/experience/MosaicGallery.tsx`
- Images/alt → **Sanity CMS** `experienceHome.mosaic` assets; fallback `src/content/experience/mosaic.ts`.
- Section heading/labels (if any) and layout → **Hard-coded** in component.

### FAQ Schema/Content — injected via `FAQ_SCHEMA` and `ExperiencePicker`’s FAQList
- FAQ items (`q`, `aHtml`) → **Hard-coded** `src/content/experience/faq.ts`; not sourced from Sanity.
- FAQ JSON-LD built from these hard-coded items.

### Final CTA — `src/components/shotguns/CTASection.tsx`
- Body text and primary/secondary labels/hrefs → **Hard-coded** `src/content/experience/cta.ts`.
- CTA heading “Begin your fitting” → **Hard-coded** in component.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payload questions (visit planning) → **Hard-coded** at call site; component is generic.

### Data Fetch & Mapping
- `getExperiencePageData` fetches `experienceHome` (hero, picker, mosaic) and merges into fixture `experienceData`; other fields (visit, fitting options, FAQ, CTA, scheduler) remain fixtures.
- `getExperienceNetworkData` fetches `scheduledEvent`, `authorizedDealer`, and `recommendedServiceCenter` collections for the travel network; no code-side static content for these lists.

## Migration Recommendations
- High: CMS-ify visit/booking copy (visit section, fitting options, scheduler URLs/titles) and the final CTA text/links.
- High: Move FAQ items into Sanity (experienceHome or separate FAQ doc) to avoid hard-coded answers and keep schema in sync.
- Medium: CMS-ify chat prompt/eyebrow/body for visit planning so concierge messaging can be tuned.
- Medium: Externalize section headings/labels and background images for picker/booking into Sanity or i18n/media settings for art direction flexibility.
- Low: Consider CMS control for button labels (“Reserve this session”, “Begin Your Fitting”) if wording changes often.

## Conclusion
- Estimated CMS vs hard-coded: ~55–60% CMS-driven (hero, picker cards, mosaic imagery, travel network data) vs ~40–45% hard-coded (visit/booking content, FAQ, CTA, chat prompts, headings/backgrounds).
- Top improvements: (1) CMS-ify visit/booking/CTA content, (2) move FAQs to Sanity, (3) make chat prompt and section headings/backgrounds editable, (4) allow scheduler settings and fitting options to be managed in CMS, (5) expose button/label text for non-engineer updates.
