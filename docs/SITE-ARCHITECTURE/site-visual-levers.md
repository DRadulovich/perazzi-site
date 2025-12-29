# Site Visual Architecture Guide

Purpose: Map each site UI element/type to the single-source lever that controls its visual style.
Scope: Site UI only (`src/app/(site)`, `src/components`). `Admin/Studio/pgpt-insights` are separate.

Legend
- Lever = the place you change to affect all instances of that element/type.
- Local = the component has bespoke styling; change it in that file.

## Global visual levers (site-wide)

1) Tokens + theme
- Lever: `src/styles/site-theme.css`
- Controls: CSS variables for color/surfaces/ink/borders, focus ring, scrims; Tailwind @theme inline color bindings; premium radius/shadow utilities.
- Use when: any site-wide color/surface change, or global radius/shadow adjustment.

2) Fonts / typography tokens
- Lever: `src/app/layout.tsx` (font variables) and `src/styles/site-theme.css` (@theme inline font bindings)
- Controls: font families for headings/body/mono.

3) Premium radius + shadow scale
- Lever: `src/styles/site-theme.css` (.rounded-*, .shadow-* utilities)
- Controls: all uses of rounded-xl/2xl/3xl and shadow-soft/medium/elevated.

4) Focus ring
- Lever: `src/styles/site-theme.css` (.focus-ring)
- Controls: focus appearance on all components using the class.

5) Prose (long-form typography)
- Lever: `src/styles/site-theme.css` (typography plugin + .prose overrides)
- Controls: PortableText/SafeHtml blocks using className="prose ...".

6) Theme switching
- Lever: `src/app/layout.tsx` (data-theme on <html>), `src/components/ui/section.tsx` (per-section override)
- Controls: light/dark token switches.

## Core primitives (single-source levers)

Typography
- Heading: `src/components/ui/heading.tsx`
- Text: `src/components/ui/text.tsx`
- Page header stack: `src/components/page-heading.tsx` (composes Heading/Text)

Controls
- Button: `src/components/ui/button.tsx`
- Input: `src/components/ui/input.tsx`
- Textarea: `src/components/ui/textarea.tsx`

Layout
- Section (surface + border + theme): `src/components/ui/section.tsx`
- Container (width + padding): `src/components/ui/container.tsx`

Overlays / interactions
- Dialog: `src/components/ui/dialog.tsx`
- Popover: `src/components/ui/popover.tsx`
- Tooltip: `src/components/ui/tooltip.tsx`
- Collapsible: `src/components/ui/collapsible.tsx`
- VisuallyHidden: `src/components/ui/visually-hidden.tsx`

Rich text
- Portable Text renderer: `src/components/PortableText.tsx`
- Legacy HTML renderer: `src/components/SafeHtml.tsx`
- Prose styling: `src/styles/site-theme.css`

Icons
- Standard: lucide-react (use consistent size + strokeWidth per usage)
- Lever: local component where the icon is used

## Layout shell and global navigation

- Site shell (header/footer wrapper): `src/components/site-shell.tsx`
  Lever: local (uses tokens, Section/Container)
- Primary navigation: `src/components/primary-nav.tsx`
  Lever: local for layout/visuals; uses lucide icons (size + stroke here)
- Skip link: `src/components/skip-to-content.tsx`
  Lever: `src/styles/site-theme.css` (.skip-link)

## Site sections by feature area

Home
- Hero + core layout: `src/components/home/hero-banner.tsx` (local styling)
- Timeline blocks: `src/components/home/timeline-scroller.tsx`, `src/components/home/timeline-item.tsx` (local)
- Scroll indicator: `src/components/home/scroll-indicator.tsx` (local icon sizing)

Shotguns
- Landing sections and cards: `src/components/shotguns/*` (local, uses Heading/Text/Section)
- Data-heavy layouts:
  - Model search: `src/components/shotguns/ModelSearchTable.tsx` (local)
  - Discipline rail: `src/components/shotguns/DisciplineRail.tsx` (local)
  - Engraving galleries: `src/components/shotguns/EngravingGallery.tsx`, `EngravingGradesCarousel.tsx` (local)
  - Wood carousel: `src/components/shotguns/WoodCarousel.tsx` (local)
- If the change is typography or buttons, update primitives; otherwise edit the component file.

Engravings
- Engraving search experience: `src/components/engravings/EngravingSearchTable.tsx` (local)

Experience
- Hero and feature sections: `src/components/experience/ExperienceHero.tsx`, `ExperiencePicker.tsx`, `VisitFactory.tsx` (local)
- Booking + FAQ + Travel Network + Mosaic: `src/components/experience/BookingOptions.tsx`, `FAQList.tsx`, `TravelNetwork.tsx`, `MosaicGallery.tsx` (local)

Service
- Hero and overview: `src/components/service/ServiceHero.tsx`, `ServiceOverview.tsx` (local)
- Editorial + FAQs + downloads: `src/components/service/PartsEditorial.tsx`, `FAQList.tsx`, `CareGuidesDownloads.tsx` (local)

Bespoke
- Build hero + steps + journey: `src/components/bespoke/BuildHero.tsx`, `BuildStepItem.tsx`, `JourneyOverview.tsx`, `BuildStepsScroller.tsx` (local)
- Booking/assurance cards: `src/components/bespoke/BookingOptions.tsx`, `AssuranceBlock.tsx`, `ExpertCard.tsx` (local)

Heritage
- Hero + era sections: `src/components/heritage/HeritageHero.tsx`, `HeritageEraSection.tsx` (local)
- Timeline/event cards: `src/components/heritage/HeritageEventSlide.tsx` (local)
- Supporting sections: `ChampionsGallery.tsx`, `OralHistories.tsx`, `SerialLookup.tsx`, `FactoryPhotoEssay.tsx` (local)

Journal
- Article content: `src/components/journal/PortableBody.tsx` + `PortableGallery.tsx` (PortableText + prose)
- Cards + hero: `src/components/journal/FeaturedStoryCard.tsx`, `ArticleHero.tsx`, `CategoryHeader.tsx` (local)
- Newsletter: `src/components/journal/NewsletterSignup.tsx` (local)

Chat (site UI)
- Chat panel + conversation: `src/components/chat/ChatPanel.tsx`, `ConversationView.tsx` (local)
- Input + widget: `src/components/chat/ChatInput.tsx`, `ChatWidget.tsx` (local)

Concierge (site UI)
- Concierge shell + drawers: `src/components/concierge/ConciergePageShell.tsx`, `BuildSheetDrawer.tsx`, `SanityDetailsDrawer.tsx` (local)
- Concierge hero + notices: `src/components/concierge/ConciergeHero.tsx`, `GuardrailNotice.tsx` (local)

Theme toggle
- Theme control UI: `src/components/theme/ThemeToggle.tsx` (local; uses global tokens)

## How to use this guide

- Change typography everywhere:
  - `src/components/ui/heading.tsx`
  - `src/components/ui/text.tsx`
  - `src/styles/site-theme.css` (prose)

- Change surfaces (cards/sections) everywhere:
  - `src/components/ui/section.tsx`
  - `src/styles/site-theme.css` (tokens + shadows + radii)

- Change buttons/inputs everywhere:
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`

- Change overlay styling everywhere:
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/tooltip.tsx`

- Change rich text rendering:
  - `src/components/PortableText.tsx`
  - `src/components/SafeHtml.tsx`
  - `src/styles/site-theme.css` (prose)

## Notes
- Most feature components are intentionally bespoke. They inherit tokens and typography primitives but keep local layout/visuals.
- If you want a bespoke component to become single-source, we can extract a new primitive into `src/components/ui`.
