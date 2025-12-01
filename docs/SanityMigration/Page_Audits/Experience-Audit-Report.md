# Sanity Content Audit – Experience

## Overview
- /experience highlights the Perazzi visit/fitting/demo journey, offers booking paths, and lists travel/dealer availability. This audit maps which visible copy/media come from Sanity versus hard-coded sources.

## Route & Files Scanned
- Primary route: `src/app/experience/page.tsx`
- UI components: `src/components/experience/ExperienceHero.tsx`, `ExperiencePicker.tsx`, `FAQList.tsx`, `VisitFactory.tsx`, `BookingOptions.tsx`, `TravelNetwork.tsx`, `MosaicGallery.tsx`, `src/components/shotguns/CTASection.tsx`
- Data helpers: `src/lib/experience-data.ts`
- Static content seeds: `src/content/experience/{hero.ts,picker.ts,visit.ts,fitting.ts,faq.ts,cta.ts,scheduler.ts,mosaic.ts}`
- Sanity queries: `src/sanity/queries/experience.ts`
- Sanity schemas: `sanity/schemas/documents/experienceHome.ts`, `sanity/schemas/scheduledEvent.ts`, `sanity/schemas/authorizedDealer.ts`, `sanity/schemas/recommendedServiceCenter.ts`

## Summary of Content Sources
- Roughly ~45% of the visible content can be Sanity-driven (hero, picker cards/media, mosaic images, travel schedule/dealer lists). The remaining ~55% (section headings/intros, visit/fitting guidance, FAQ, booking options, final CTA, scheduler URLs, chat prompts) is hard-coded in the repo.
- CMS coverage is limited to `experienceHome` (hero, picker, mosaic) and travel/dealer documents; most persuasive copy and CTAs remain in static content files.

## Detailed Findings by Section

### Experience Hero (`src/components/experience/ExperienceHero.tsx`)
- Breadcrumb labels “Home”, “Experience”, eyebrow “Experience”, and “Scroll” label are **Hard-coded** (component lines ~92-133).
- Hero title, subheading, and background image come from **Sanity CMS** `experienceHome.hero.{title,subheading,background}` via `getExperienceHome` (fallback in `src/content/experience/hero.ts`).

### Experience Picker & FAQ (`src/components/experience/ExperiencePicker.tsx`, `FAQList.tsx`)
- Section heading “Choose your path” and subheading “Visit, fit, or demo with Perazzi” are **Hard-coded** (ExperiencePicker lines ~93-101).
- Background image `/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg` is **Hard-coded** (line ~67).
- Card content: `title`, `summary`, `href`, and `media` per card are **Sanity CMS** `experienceHome.picker[]` fields; IDs map from `_key`. `ctaLabel` and anchor overrides remain **Hard-coded** fallback values from `src/content/experience/picker.ts`.
- Micro-label “Perazzi Experience” and card layout text like arrow are **Hard-coded**.
- FAQ heading “FAQ” and lead “Questions from future owners” are **Hard-coded** (`FAQList` lines ~24-39).
- FAQ items (`q`, `aHtml`) are **Hard-coded** in `src/content/experience/faq.ts`; also used for JSON-LD in `page.tsx`.

### Visit Planning Intro (`src/app/experience/page.tsx`:92-158)
- Heading “Visit planning”, intro paragraph, concierge bullet list, closing paragraph, ChatTrigger label/payload, and button “See visit options” are **Hard-coded** in the route file.

### Visit Botticino Section (`src/components/experience/VisitFactory.tsx`)
- Section heading “Visit Botticino”, subheading “See the factory in person”, background image, and map CTA labels are **Hard-coded**.
- Intro copy (`visit.introHtml`), location name/address/hours/notes/map embeds, “What to expect” content, and CTA label/href are **Hard-coded** in `src/content/experience/visit.ts` (passed through `getExperiencePageData` without Sanity overrides).

### Fitting Guidance Intro (`src/app/experience/page.tsx`:160-226)
- Heading “Fitting guidance”, intro paragraph, concierge bullet list, closing paragraph, ChatTrigger label/payload, and button “View fitting sessions” are **Hard-coded** in the route.

### Booking Options & Scheduler (`src/components/experience/BookingOptions.tsx`)
- Section heading “Book a fitting” and subheading “Choose the session that fits your journey” are **Hard-coded**.
- Each option’s `title`, `durationMins`, `descriptionHtml`, and `href` come from **Hard-coded** `src/content/experience/fitting.ts`.
- CTA button label “Reserve this session” is **Hard-coded**.
- Scheduler block (title “Schedule with concierge”, button text toggles, helper text) is **Hard-coded**; iframe `src`/title/fallback href are **Hard-coded** in `src/content/experience/scheduler.ts`.

### Travel Guide CTA (`src/app/experience/page.tsx`:228-294)
- Heading “Meet us on the road”, intro, concierge bullet list, closing paragraph, ChatTrigger label/payload, and link “View schedule and dealers” are **Hard-coded** in the route.

### Travel Network Tabs (`src/components/experience/TravelNetwork.tsx`)
- Section title “Travel network”, lead “Meet us on the road”, supporting sentence, tab labels, empty-state copy, and background image are **Hard-coded**.
- Schedule list items (`eventName`, `eventLocation`, `startDate`, `endDate`, optional `location`) come from **Sanity CMS** documents of type `scheduledEvent` via `getExperienceNetworkData`.
- Dealer list items (`dealerName`, `state`, `address`, `city`) come from **Sanity CMS** documents of type `authorizedDealer`.
- `recommendedServiceCenter` documents are fetched but not displayed.

### Mosaic Gallery (`src/components/experience/MosaicGallery.tsx`)
- Section eyebrow “Atelier mosaic” and heading “Moments from the journey” are **Hard-coded**.
- Image assets (`url`, `alt`, optional `caption`, `aspectRatio`) come from **Sanity CMS** `experienceHome.mosaic[]` (fallbacks in `src/content/experience/mosaic.ts`).

### Final CTA (`src/components/shotguns/CTASection.tsx` used in `page.tsx`:297-303)
- Component heading “Begin your fitting” is **Hard-coded** inside `CTASection`.
- Body text and button labels/hrefs come from **Hard-coded** `src/content/experience/cta.ts` (`finalCta` in `experienceData`); not sourced from Sanity.

## Migration Recommendations
- High: Move Visit Planning intro (route), Fitting Guidance intro (route), and Travel Guide CTA blocks into Sanity (single `experiencePage` document with structured fields for headings, body, bullets, chat button labels/payloads, and link targets).
- High: Migrate VisitFactory content (`visit.introHtml`, location/address/hours/map embeds, “What to expect”, CTA) into Sanity to keep logistics accurate.
- High: Externalize BookingOptions copy (section heading/subheading, fitting options array, CTA label, scheduler URLs/text) to Sanity so ops can adjust offerings without code deploys.
- Medium: Make Experience Picker heading/subheading and CTA labels editable (add fields to `experienceHome` or a new `experiencePickerSettings` object); extend schema to allow `ctaLabel`.
- Medium: CMS-enable FAQ items (currently static in `src/content/experience/faq.ts`) so the concierge team can update responses; reuse for JSON-LD.
- Medium: Final CTA (`finalCta` text and button labels) should live in Sanity for quick iteration.
- Low: Allow editing of section backgrounds (experience picker, visit factory, booking, travel network) via Sanity image fields if design flexibility is desired.
- Low: TravelNetwork intro copy/tab labels could move to Sanity if marketing wants to tweak messaging independently of code.

## Conclusion
- Approximately 45% of the page is CMS-driven (hero, picker cards/media, mosaic gallery, travel schedule/dealers); about 55% remains hard-coded (all intro sections, VisitFactory, booking options/scheduler, FAQ, final CTA, most headings/backgrounds, chat labels).
- Top impact changes: (1) move Visit/Fitting/Travel intro blocks into Sanity, (2) migrate VisitFactory logistics content, (3) externalize booking options + scheduler text/links, (4) CMS-enable FAQ items, and (5) make final CTA + picker headings/cta labels editable. These shifts would make the Experience page largely editor-managed without code changes.
