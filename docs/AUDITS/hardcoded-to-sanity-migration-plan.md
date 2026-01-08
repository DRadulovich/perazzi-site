# Hardcoded to Sanity Migration Plan (Public Site)

Generated: 2026-01-07

## Scope
- In scope: public site user-facing copy (marketing copy + system UI labels) and all fixture/config content that renders on the public site.
- Exclusions: admin pages, ARIA labels, and error messages.
- Goal: zero-diff migration (current visuals and text remain unchanged during and after the move).

## Inventory of non-CMS content to migrate

### Global navigation and footer UI
| Location | Current source | Proposed Sanity home | Notes |
| --- | --- | --- | --- |
| `src/components/site-shell.tsx` primary/secondary nav links | Hardcoded arrays | Extend `siteSettings` (new `primaryNav`, `secondaryNav`) | Drives top nav + footer lists. |
| `src/components/site-shell.tsx` footer text, column headers, legal links | Hardcoded strings | Extend `siteSettings.footer` (description, column labels, legal links, address line) | Includes "Perazzi S.p.A - Botticino, Italy". |
| `src/components/primary-nav.tsx` nav links (Home, Shotguns, etc) | Hardcoded `NAV_LINKS` | Extend `siteSettings.nav` (or new `siteNavigation` doc) | Preserve ordering and optional flyout mapping. |
| `src/components/primary-nav.tsx` flyout copy and cards | Hardcoded `ShotgunsFlyout`, `SHOTGUN_GRID`, `ExperienceFlyout`, `HeritageFlyout`, `HERITAGE_LINKS` | Add nested fields under `siteSettings` for flyouts | Includes headings, descriptions, section labels, CTA labels, and link labels. |
| `src/components/primary-nav.tsx` Store button label | Hardcoded string | `siteSettings.nav.store` | External link label and URL. |
| `src/messages/en.json` brand label (Header.brand) | i18n JSON | `siteSettings.brandLabel` (optional) | If keeping next-intl, skip; if migrating, store in Sanity and keep i18n for ARIA only. |

### Shared UI labels and CTAs
| Location | Current source | Proposed Sanity home | Notes |
| --- | --- | --- | --- |
| `src/components/shotguns/CTASection.tsx` heading "Begin your fitting" | Hardcoded | `siteSettings.ctaDefaults.sectionHeading` | Shared heading for CTA blocks. |
| `src/components/home/hero-banner.tsx` fallback CTAs | Hardcoded constants | `homeSingleton.heroCtas` (already in schema) | Seed current labels/prompts. |
| `src/components/journal/JournalHero.tsx` label "Journal" | Hardcoded | Add `journalLanding.hero.label` or `siteSettings.journalUi.label` | Used on journal landing. |
| `src/components/journal/CategoryHeader.tsx` labels "Journal" and "Featured:" | Hardcoded | Add `journalCategory.ui` or `siteSettings.journalUi` | Shared across journal category pages. |
| `src/components/heritage/SerialLookup.tsx` heading fallback | Hardcoded fallback | `heritageHome.serialLookupUi.heading` (already in schema) | Seed to remove fallback. |

### Page-level hardcoded copy (public routes)
| Route | Current source | Proposed Sanity home | Notes |
| --- | --- | --- | --- |
| `/engravings` | `src/app/(site)/engravings/page.tsx` | New `engravingSearchPage` doc | Hero heading + SEO title/description + hero image. |
| `/shotguns/all` | `src/app/(site)/shotguns/all/page.tsx` | New `modelSearchPage` doc | Hero heading + SEO title/description + hero image. |
| `/fschat` | `src/app/(site)/fschat/page.tsx` | New `fullScreenChatPage` doc | Header title + SEO title/description. |
| `/concierge` | `src/app/(site)/concierge/page.tsx` | New `conciergePage` doc | Hero eyebrow/title/subheading/bullets + hero background image. |
| `/bespoke-build` | `src/app/(site)/bespoke-build/page.tsx` | New `bespokeBuildLanding` doc | Page heading + body copy. |
| `/bespoke-build/[stage]` | `src/app/(site)/bespoke-build/[stage]/page.tsx` | New `bespokeBuildStage` docs | Stage title/description/body keyed by slug. |
| `/heritage/[section]` | `src/app/(site)/heritage/[section]/page.tsx` | New `heritageSection` docs | Section title/body keyed by slug. |
| `/shotguns/mx`, `/shotguns/ht`, `/shotguns/tm`, `/shotguns/dc`, `/shotguns/sho` | Hardcoded guidance copy in each page | Add `platform.guidance` fields or new `platformPage` doc | "Questions about the ... Platform" copy and CTA text. |
| `/shotguns/disciplines/[slug]` | `fallbackText` in page | Add `discipline.marqueeFallbackText` | Discipline-level fallback copy. |
| `/shotguns/gauges` | CTA text in page + fixtures in `src/content/shotguns/gauges*.ts` | New `shotgunsGaugesPage` doc + extend `gauge` schema | Move hero, editorial, sidebar, FAQ, and CTA text. |
| `/shotguns/grades` | CTA text in page + fixtures in `src/content/shotguns/grades*.ts` | New `shotgunsGradesPage` doc + extend `grade` schema | Move hero, process note, provenance copy, CTA. |
| `/journal/stories-of-craft`, `/journal/champion-interviews`, `/journal/news` | Category fixtures + empty state copy | New `journalCategory` docs | Store category title, intro, and empty-state copy. |
| `/journal/[slug]` | Empty-state copy + SEO fallback description | `journalLanding` defaults or new `articleDefaults` doc | Store default title/description for missing content. |
| `/the-build/why-a-perazzi-has-a-soul` | IntroSection copy | New `buildJourneyLanding` doc | Intro label/title/body. |

### Fixture-driven content to seed into Sanity
| Source file(s) | Current source | Proposed Sanity home | Notes |
| --- | --- | --- | --- |
| `src/content/home/*` | Local fixtures | `homeSingleton` | Seed hero, timeline, guide, marquee, finale, and assets. |
| `src/content/experience/*` | Local fixtures | `experienceHome` | Seed hero, picker, visit/fitting blocks, FAQ, scheduler, mosaic, CTAs. |
| `src/content/service/*` | Local fixtures | `serviceHome` + `recommendedServiceCenter` | Seed hero, overview, guidance, FAQ, guides, parts; migrate `service/locations.ts` into service-center docs. |
| `src/content/heritage/*` | Local fixtures | `heritageHome`, `heritageEvent`, `champion`, `manufactureYear` | Seed hero/intro/timeline/champions/oral histories/factory essay. |
| `src/content/build/*` | Local fixtures | `bespokeHome` | Seed hero, steps, experts, booking, assurance, footer CTA. |
| `src/content/shotguns/landing.ts` | Local fixtures | `shotgunsLanding` | Seed hero + UI copy + advisory blocks + background images. |
| `src/content/shotguns/series.*.ts` | Local fixtures | Extend `platform` or new `platformPage` | Add fields for hero title/subheading, at-a-glance data, story HTML, highlights, discipline map, champion data, related articles. |
| `src/content/shotguns/disciplines.ts` | Local fixtures | Extend `discipline` | Add fields for overview HTML, recipe, champion details, related articles, hero media. |
| `src/content/shotguns/gauges.ts` | Local fixtures | Extend `gauge` | Add label, description, handling notes, barrel lengths, disciplines, FAQ. |
| `src/content/shotguns/grades.ts` | Local fixtures | Extend `grade` | Add description, gallery, provenance HTML, options. |
| `src/content/journal/articles/*` and `src/content/journal/authors.ts` | Local fixtures | `article`, `author` | Seed articles and authors into CMS. |
| `src/content/journal/categories/*` | Local fixtures | New `journalCategory` docs | Category title, hero copy, empty state. |
| `src/config/heritage-eras.ts` | Config | `heritageHome.erasConfig` | Migrate era labels, year ranges, and background images. |

## Required schema additions or extensions
- Extend `siteSettings` with:
  - `primaryNav`, `secondaryNav`, `footerDescription`, `footerColumns`, `footerLegalLinks`, `addressLine`, `storeLink`.
  - `navFlyouts` object with `shotguns`, `experience`, `heritage` sections (headings, descriptions, CTA labels, link lists, cards).
  - Optional `ctaDefaults` for shared CTA headings and labels.
- Extend `experienceHome` with:
  - `bookingSection.backgroundImage` (for `/Photos/p-web-89.jpg`).
  - `faqSection.backgroundImage` (for `/redesign-photos/experience/pweb-experience-faq-bg.jpg`).
- New documents:
  - `engravingSearchPage` (hero title/description, hero image, SEO).
  - `modelSearchPage` (hero title/description, hero image, SEO).
  - `fullScreenChatPage` (header title, SEO).
  - `conciergePage` (hero copy + hero image).
  - `bespokeBuildLanding` (title/description).
  - `bespokeBuildStage` (slug, title, description, body, media).
  - `heritageSection` (slug, title, body, optional media).
  - `journalCategory` (slug, title, subheading, empty-state copy, optional hero image).
  - `buildJourneyLanding` (intro label/title/body).
  - `shotgunsGaugesPage` (hero, editorial HTML, sidebar note, FAQ, CTA).
  - `shotgunsGradesPage` (hero, provenance HTML, process note, CTA).
- Extend existing docs:
  - `platform` to include `heroTitle`, `heroSubheading`, `atAGlance`, `storyHtml`, `highlights`, `disciplineMap`, `champion`, `relatedArticles`, and `guidanceCta`.
  - `discipline` to include `overviewHtml`, `recipe`, `champion`, `articles`, and `marqueeFallbackText`.
  - `gauge` to include `label`, `description`, `commonBarrels`, `typicalDisciplines`, and `faq`.
  - `grade` to include `provenanceHtml`, `options`, and other page-level copy.
  - `journalLanding` to include `hero.label` (and optionally `journalUi.featuredLabel` if shared across categories).

## Non-CMS photos to migrate into Sanity assets

### Local/static asset paths (current public assets)
| Asset path | Usage | Proposed Sanity field |
| --- | --- | --- |
| `/Photos/p-web-d-2.jpg` | Engravings hero image | `engravingSearchPage.heroImage` |
| `/Photos/olympic-medals-1.jpg` | Model search hero image | `modelSearchPage.heroImage` |
| `/Photos/p-web-89.jpg` | BookingOptions background | `experienceHome.bookingSection.backgroundImage` |
| `/images/p-web-d-25.jpg` | Build journey hero image | `buildJourneyLanding.heroImage` (or `intro.backgroundImage`) |
| `/redesign-photos/p-web-20.jpg` | Concierge hero background | `conciergePage.hero.backgroundImage` |
| `/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg` | Home timeline background | `homeSingleton.timelineFraming.backgroundImage.image` |
| `/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg` | Home marquee background | `homeSingleton.marqueeUi.backgroundImage.image` |
| `/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg` | Shotguns platform grid background | `shotgunsLanding.platformGridUi.backgroundImage.image` |
| `/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg` | Shotguns discipline rail background | `shotgunsLanding.disciplineRailUi.backgroundImage.image` |
| `/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg` | Trigger explainer background | `shotgunsLanding.triggerExplainer.backgroundImage.image` |
| `/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg` | Engraving carousel background | `shotgunsLanding.engravingCarouselUi.backgroundImage.image` |
| `/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg` | Bespoke build steps background | `bespokeHome.stepsIntro.backgroundImage` |
| `/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg` | Experience picker background | `experienceHome.pickerUi.backgroundImage` |
| `/redesign-photos/experience/pweb-experience-faq-bg.jpg` | Experience FAQ background | `experienceHome.faqSection.backgroundImage` (new field) |
| `/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg` | Visit factory background | `experienceHome.visitFactorySection.backgroundImage` |
| `/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg` | Travel network background | `experienceHome.travelNetworkUi.backgroundImage` |
| `/redesign-photos/heritage/perazzi-legacy-lives-on.jpg` | Heritage intro background fallback | `heritageHome.heritageIntro.backgroundImage` |
| `/redesign-photos/heritage/pweb-heritage-era-1-founding.jpg` | Heritage era config | `heritageHome.erasConfig[].backgroundImage` |
| `/redesign-photos/heritage/pweb-heritage-era-2-olympic.jpg` | Heritage era config | `heritageHome.erasConfig[].backgroundImage` |
| `/redesign-photos/heritage/pweb-heritage-era-3-champions.jpg` | Heritage era config | `heritageHome.erasConfig[].backgroundImage` |
| `/redesign-photos/heritage/pweb-heritage-era-4-bespoke.jpg` | Heritage era config | `heritageHome.erasConfig[].backgroundImage` |
| `/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg` | Heritage era config / champions gallery | `heritageHome.erasConfig[].backgroundImage` and `heritageHome.championsGalleryUi.backgroundImage` |
| `/cinematic_background_photos/p-web-25.jpg` | Bespoke cinematic strip | `bespokeHome.cinematicStrips[].image` (asset missing in repo) |
| `/cinematic_background_photos/p-web-16.jpg` | Bespoke cinematic strip | `bespokeHome.cinematicStrips[].image` (asset missing in repo) |
| `/cinematic_background_photos/p-web-2.jpg` | Serial lookup background | `heritageHome.serialLookupUi.backgroundImage` (asset missing in repo) |

### Remote image URLs (not CMS managed)
- `src/content/home/factory-assets.ts` (unsplash via Cloudinary fetch)
- `src/content/shotguns/grades.ts` (unsplash images via Cloudinary fetch)
- `src/content/shotguns/disciplines.ts` (unsplash images via Cloudinary fetch)
- `src/content/shotguns/series.*.ts` (Sanity CDN and other remote images)
- `src/content/shotguns/grades-content.ts` (Cloudinary hosted hero image)

Plan: upload these to Sanity assets and replace URLs in seeded documents so all imagery lives in Sanity.

## Zero-diff execution plan
1) Schema work
   - Add the new document types listed above.
   - Extend existing types (`platform`, `discipline`, `gauge`, `grade`, `siteSettings`) with required fields.
2) Seed mapping
   - Create a seed map that pulls current values from `src/content/**`, `src/config/**`, and hardcoded page/component strings.
   - Include image assets (local files + remote URLs) for upload to Sanity.
3) Populate Sanity
   - Import seed documents and assets.
   - Verify all required documents exist (siteSettings, homeSingleton, experienceHome, serviceHome, etc).
4) Code wiring (no behavior change)
   - Update GROQ queries to pull new fields and new documents.
   - Keep current hardcoded values as fallbacks until Sanity content is confirmed populated.
5) Validation
   - Text diff pass (before/after) for each public route.
   - Visual regression spot check (hero blocks, nav flyouts, CTA blocks).

## Validation checklist
- All public routes render with identical copy before and after migration.
- All navigation and flyout labels are sourced from Sanity with fallback in place.
- All photos listed above are stored in Sanity assets and referenced by image fields (no broken static paths).
- No admin pages touched.
- No ARIA labels or error messages moved into Sanity.

## Open questions / decisions
- Should UI labels in `src/messages/en.json` remain in next-intl or move into Sanity (with i18n handled in Sanity)?
- Do we want to convert placeholder pages (`/bespoke-build`, `/heritage/[section]`) into fully authored CMS pages or keep them static until content exists?
- Should `platform` and `discipline` be extended or should we introduce dedicated `platformPage` and `disciplinePage` documents to avoid schema bloat?
