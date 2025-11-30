# Sanity Content Audit – Shotguns

## Overview
- Audited the Shotguns landing page (`src/app/shotguns/page.tsx`) to map which visible UI is driven by Sanity vs hard-coded.
- Followed all rendered components (hero, platform grid, discipline rail, trigger explainer, engraving carousel, inline guide/gauge/trigger sections, final CTA) plus data-fetching utilities and Sanity schemas/queries.

## Route & Files Scanned
- `src/app/shotguns/page.tsx`
- `src/lib/shotguns-data.ts`
- `src/sanity/queries/shotguns.ts`
- `sanity/schemas/documents/{shotgunsLanding.ts,platform.ts,discipline.ts,grade.ts}`
- Fallback content: `src/content/shotguns/{landing.ts,disciplines.ts,gauges.ts,grades.ts,...}`
- Components:
  - `src/components/shotguns/LandingHero.tsx` (uses `src/components/home/hero-banner.tsx`)
  - `src/components/shotguns/PlatformGrid.tsx` + `PlatformCard.tsx`
  - `src/components/shotguns/DisciplineRail.tsx`
  - `src/components/shotguns/TriggerExplainer.tsx`
  - `src/components/shotguns/EngravingGradesCarousel.tsx`
  - `src/components/shotguns/CTASection.tsx`
  - Inline sections in `src/app/shotguns/page.tsx` for discipline-fit, gauge selection, trigger choice
  - `src/components/chat/ChatTriggerButton.tsx`

## Summary of Content Sources
- Roughly 60% CMS-driven (Sanity) vs 40% hard-coded. Core data blocks—hero media/text, platforms, trigger explainer content, discipline details, engraving grade galleries—pull from Sanity (`shotgunsLanding`, `platform`, `discipline`, `grade`) with code-side fixtures as fallbacks.
- Significant supporting copy remains hard-coded: three advisory sections (“Discipline fit,” “Gauge selection,” “Trigger choice”), CTA labels/payloads, hero CTA copy, section headings/eyebrows, background images, and final CTA content.
- Page is moderately CMS-editable: the primary structured catalog data swaps from Sanity, but several text-heavy guidance sections and CTAs require code changes.

## Detailed Findings by Section

### Hero (LandingHero → HeroBanner)
- File: `src/components/shotguns/LandingHero.tsx` → `src/components/home/hero-banner.tsx`
- Content:
  - Background image/alt/caption, hero title/subheading → **Sanity CMS** `shotgunsLanding.hero.{background,title,subheading}` via `getShotgunsLanding` (GROQ `shotgunsLandingQuery`); fallback `src/content/shotguns/landing.ts`.
  - CTA “Ask the concierge” button text & chat payload; secondary link “Explore shotguns” → **Hard-coded** in `hero-banner.tsx` (~lines 90–115).
  - Manifesto overlay lines, scroll indicator text → **Hard-coded** in `hero-banner.tsx`.

### Platform Grid
- File: `src/components/shotguns/PlatformGrid.tsx` + `PlatformCard.tsx`
- Content:
  - Platform names, taglines, hero images, disciplines, counterparts, highlights, champion info → **Sanity CMS** `platform` docs via `getPlatforms` → `landing.platforms`; fallback `src/content/shotguns/landing.ts`.
  - Section heading/subheading (“Platforms & Lineages…”) and background image `/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg` → **Hard-coded** in `PlatformGrid.tsx`.
  - Chat buttons “Ask about {platform.name}” and payloads → **Hard-coded** labels/payload builder (`buildPlatformPrompt`), though platform name is CMS-provided.
  - Card footer text “Explore the {platform.name} lineage” → **Hard-coded** in `PlatformCard.tsx`.

### Discipline Fit Advisory (inline)
- File: `src/app/shotguns/page.tsx`
- Content:
  - Eyebrow “Discipline fit,” heading “The geometry of rhythm,” two descriptive paragraphs, ChatTrigger (“Ask Perazzi” + payload), and bullet list for Trap/Skeet/Sporting → **Hard-coded** in route file.

### Discipline Rail
- File: `src/components/shotguns/DisciplineRail.tsx`
- Content:
  - Discipline names, overview text (HTML), hero images, recommended platforms, popular models, champion images → **Sanity CMS** `discipline` docs via `getDisciplines` merged into `landing.disciplines`; fallback fixtures in `src/content/shotguns/landing.ts`/`disciplines.ts`.
  - Category tabs (“American Disciplines,” etc.), section heading/subheading, labels (“Discipline categories,” “Recommended platforms,” “Most Popular Models”), background image `/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg` → **Hard-coded** in component.
  - Model detail modal labels (“Platform,” “Gauge,” etc.) → **Hard-coded**.

### Gauge Selection Advisory
- File: `src/app/shotguns/page.tsx`
- Content:
  - Heading “Gauge selection,” paragraph copy, ChatTrigger (“Ask about gauges” + payload), link text “Explore gauges,” bullets from `landing.gaugesTeaser.bullets`, closing paragraph → **Hard-coded fixtures** from `src/content/shotguns/landing.ts` (not replaced by Sanity in `applyLanding`).

### Trigger Explainer
- File: `src/components/shotguns/TriggerExplainer.tsx`
- Content:
  - Title, rich text body (`copyHtml`), diagram image/caption, CTA links → **Sanity CMS** `shotgunsLanding.triggerExplainer.{title,copy,diagram,links}`; fallback `src/content/shotguns/landing.ts`.
  - Subheading “Removable or fixed—choose by confidence and feel.” and toggle labels (“Show details/Hide details”) → **Hard-coded** in component.
  - Background image `/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg` → **Hard-coded**.

### Trigger Choice Advisory
- File: `src/app/shotguns/page.tsx`
- Content:
  - Heading “Trigger choice,” paragraph copy, ChatTrigger (“Choose my trigger” + payload), link “See trigger details,” bullet list (fixed vs removable vs support/travel), closing paragraph → **Hard-coded** in route.

### Engraving Grades Carousel
- File: `src/components/shotguns/EngravingGradesCarousel.tsx`
- Content:
  - Grade names, descriptions, galleries (hero + engraving/wood) → **Sanity CMS** `grade` docs via `getGrades`; fallback `src/content/shotguns/grades.ts`/`grades-content.ts`.
  - Category labels (“The Benchmark,” “SC3 Grade,” etc.), section heading/subheading, background image `/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg`, CTA “View engraving” → **Hard-coded** in component.

### Final CTA
- File: `src/components/shotguns/CTASection.tsx` (invoked in route)
- Content:
  - Heading “Begin your fitting” → **Hard-coded** in component.
  - Body text and button labels/hrefs passed from route (`"Begin Your Fitting"`, `"Request a Visit"`, text about Botticino atelier) → **Hard-coded** in `src/app/shotguns/page.tsx`.

### ChatTrigger Buttons
- File: `src/components/chat/ChatTriggerButton.tsx`
- Labels and payload questions for each call site (discipline fit, gauge selection, trigger choice, platform grid, hero) → **Hard-coded** where invoked; component itself is generic UI/behavior.

### Data Fetch & Fallbacks
- File: `src/lib/shotguns-data.ts`
- Fetches Sanity via `getShotgunsLanding`, `getPlatforms`, `getDisciplines`, `getGrades` (`src/sanity/queries/shotguns.ts` GROQ). Applies into a cloned fixture (`src/content/shotguns`), so any missing CMS fields fall back to hard-coded fixtures (hero background, trigger diagram, platform list, discipline overviews/champions, grade galleries, gauges teaser).

## Migration Recommendations
- High: Move the three advisory sections (“Discipline fit,” “Gauge selection,” “Trigger choice”) into Sanity (or a `shotgunsLanding` subobject) so guidance copy, bullets, and chat prompts/links are editor-controlled.
- High: Make CTA labels/text (hero CTA, final CTA, gauge/trigger links, platform chat prompts) editable—either in `shotgunsLanding` or a global CTA config.
- Medium: Externalize platform grid framing copy (“Platforms & Lineages…”), discipline rail headings/category labels, and engraving carousel headings/category labels into Sanity or i18n messages.
- Medium: Add Sanity fields for the various section background images to avoid code edits for art direction.
- Low: Optional—surface ChatTrigger payload questions in CMS for marketing-controlled concierge prompts.

## Conclusion
- Estimated CMS vs hard-coded: ~60% CMS-driven (hero, platforms, trigger explainer, discipline/grade data) vs ~40% hard-coded (advisory sections, CTA copy, headings, backgrounds, chat labels).
- Most impactful improvements: (1) CMS-ify the advisory sections and their chat prompts, (2) make CTA text/links editable, (3) expose section headings/category labels and backgrounds, (4) allow platform/disciplines/gauges teaser CTAs to be set in Sanity, (5) optionally manage concierge prompt text in CMS for faster iteration.
