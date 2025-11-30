# Sanity Content Audit – Bespoke

## Overview
- Audited the Bespoke page (`src/app/bespoke/page.tsx`) to identify which visible UI is Sanity-driven vs hard-coded.
- Followed data from `getBespokePageData` (bespokeHome query + fixtures) through hero, journey steps, chat guidance block, cinematic strips, expert cards, booking/assurance sections, and final CTA.

## Route & Files Scanned
- `src/app/bespoke/page.tsx`
- Data loader: `src/lib/bespoke-data.ts`
- Sanity query: `src/sanity/queries/bespoke.ts`
- Sanity schema: `sanity/schemas/documents/bespokeHome.ts` (fields: hero, steps[], experts[], assuranceImage)
- Fallback content: `src/content/build/{hero.ts,steps.ts,experts.ts,booking.ts,assurance.ts,footerCta.ts,index.ts}`
- Components:
  - `src/components/bespoke/BuildHero.tsx`
  - `src/components/bespoke/BuildStepsScroller.tsx`
  - `src/components/bespoke/ExpertCard.tsx`
  - `src/components/bespoke/BookingOptions.tsx` (bespoke variant)
  - `src/components/bespoke/AssuranceBlock.tsx`
  - `src/components/shotguns/CinematicImageStrip.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Inline ChatTrigger section in route

## Summary of Content Sources
- Roughly 60–65% CMS-driven: hero media/title/eyebrow/intro, step titles/bodies/media, expert headshots/names/roles, assurance image, and booking/journey links all pull from Sanity `bespokeHome` when present, with fixtures as fallback.
- Roughly 35–40% hard-coded: chat guidance block, cinematic strip images/alt, booking option copy (titles/descriptions/links), assurance text/quote, footer CTA text/secondary link, and many section headings/labels.
- Page is fairly CMS-editable for the core bespoke narrative (hero, steps, experts, assurance image), but key guidance/CTA/booking copy remains in code.

## Detailed Findings by Section

### Build Hero — `src/components/bespoke/BuildHero.tsx`
- Eyebrow/title/intro HTML and background image → **Sanity CMS** `bespokeHome.hero.{eyebrow,title,intro,media}`; fallback `src/content/build/hero.ts`.
- “Scroll” label → **Hard-coded** in component.

### Build Steps Scroller — `src/components/bespoke/BuildStepsScroller.tsx`
- Step titles/bodies/media (+ optional captions/CTA) → **Sanity CMS** `bespokeHome.steps[]` mapped via `getBespokePageData`; fallback `src/content/build/steps.ts`.
- Intro headings (“The journey”, “Six moments…”, “Begin the ritual”, “Skip step-by-step”) and background image `/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg` → **Hard-coded**.

### Bespoke Guide Chat Block — inline in route (`src/app/bespoke/page.tsx`)
- Heading “Need a bespoke guide?”, paragraph, ChatTrigger label/payload, link “Request a visit”, list items under “Three things…” → **Hard-coded** in route.

### Cinematic Image Strips — `src/components/shotguns/CinematicImageStrip.tsx`
- Images/alt (`/cinematic_background_photos/p-web-25.jpg`, `/cinematic_background_photos/p-web-16.jpg`) → **Hard-coded assets** in route.

### Expert Cards — `src/components/bespoke/ExpertCard.tsx`
- Expert name/role/bio/quote/headshot → **Sanity CMS** `bespokeHome.experts[]`; fallback `src/content/build/experts.ts`.
- Section heading/eyebrow (“Atelier team”, “Meet the craftsmen…”) → **Hard-coded** in route.

### Booking Options — `src/components/bespoke/BookingOptions.tsx`
- Booking headline/options (title, duration, description, href), “what to expect” items, note → **Hard-coded** `src/content/build/booking.ts`.
- Section headings/background image inside component (if any) → **Hard-coded**.

### Assurance Block — `src/components/bespoke/AssuranceBlock.tsx`
- Assurance image → **Sanity CMS** `bespokeHome.assuranceImage`; fallback fixture.
- Assurance body/quote text → **Hard-coded** `src/content/build/assurance.ts`.
- Section heading/labels inside component → **Hard-coded**.

### Final CTA — `src/components/shotguns/CTASection.tsx`
- Body text and primary label/href → **Hard-coded** `src/content/build/footerCta.ts`.
- Secondary CTA (“Request a Visit”) → **Hard-coded** in route.
- CTA heading “Begin your fitting” → **Hard-coded** in component.

### ChatTrigger Buttons — `src/components/chat/ChatTriggerButton.tsx`
- Labels/payload questions → **Hard-coded** at call site; component is generic UI.

### Data Fetch & Mapping
- `getBespokePageData` fetches `bespokeHome` and merges CMS fields into cloned fixtures (`buildData`). Hero, steps, experts, assurance image are CMS-driven when present; booking, assurance text, footer CTA remain fixture-only.

## Migration Recommendations
- High: CMS-ify the bespoke guide block (heading, body, list, chat prompt/link) for concierge messaging control.
- High: Move booking options/“what to expect” copy and final CTA text/links into Sanity (extend `bespokeHome` or add a bespoke CTA/settings doc).
- Medium: CMS-ify assurance text/quote, not just the image.
- Medium: Allow cinematic strip assets and section headings/eyebrows (journey, experts) to be edited via CMS/i18n/media settings.
- Low: Consider CMS control for button labels (Reserve/Request/Begin) and “Scroll” label for consistency with other pages.

## Conclusion
- Estimated CMS vs hard-coded: ~60–65% CMS-driven (hero, steps, experts, assurance image) vs ~35–40% hard-coded (chat/guide block, booking/assurance text, CTA, cinematic assets, headings/labels).
- Most impactful changes: (1) CMS-ify guide + CTA/booking copy, (2) move assurance text into Sanity, (3) make cinematic/heading assets editable, (4) expose button/label text for non-developer updates, (5) optional CMS control for “what to expect”/notes content. 
