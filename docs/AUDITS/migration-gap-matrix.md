# Migration Gap Matrix (Phase 2)

Generated: 2026-01-08

Sources:
- `docs/audits/content-source-audit.md`
- `docs/audits/sanity-content-reference-map.md`
- `docs/audits/cinematic-assets-audit.md`
- Sanity field presence check (2026-01-08, production dataset)

Status legend:
- already in CMS: schema exists and content is present in Sanity
- missing in CMS: schema exists but content is empty or partially populated
- no schema field: there is no Sanity field or doc type yet

## Global UI and Shared Components
| Area | Content item | Current source | Sanity mapping | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Primary nav | Main nav labels and links (Home, Shotguns, Bespoke Journey, Experience, Heritage, Service) | `src/components/primary-nav.tsx` `NAV_LINKS` | `siteSettings.nav[]` | already in CMS | `siteSettings.nav` has 6 items; verify labels and ordering. |
| Primary nav flyouts | Shotguns flyout heading/description/CTA | `src/components/primary-nav.tsx` `ShotgunsFlyout` | `siteSettings.navFlyouts.shotguns` | no schema field | Create nav flyout fields. |
| Primary nav flyouts | Shotguns flyout card grid (title/description/href) | `src/components/primary-nav.tsx` `SHOTGUN_GRID` | `siteSettings.navFlyouts.shotguns.cards[]` | no schema field | Maps 4 cards. |
| Primary nav flyouts | Experience flyout section labels + link labels | `src/components/primary-nav.tsx` `ExperienceFlyout` | `siteSettings.navFlyouts.experience.sections[]` | no schema field | Includes CTA rows + "Find a dealer" button. |
| Primary nav flyouts | Heritage flyout heading/description/CTA + link groups | `src/components/primary-nav.tsx` `HeritageFlyout`, `HERITAGE_LINKS` | `siteSettings.navFlyouts.heritage.*` | no schema field | Includes section titles and link labels. |
| Primary nav CTAs | "Build Planner" button label + link | `src/components/primary-nav.tsx` `CTAs` | `siteSettings.navCtas.buildPlanner` | no schema field | Label + href. |
| Primary nav CTAs | "Store" label + URL | `src/components/primary-nav.tsx` `CTAs` | `siteSettings.storeLink` | no schema field | External URL + label. |
| Brand label | Header brand label | `src/messages/en.json` (`Header.brand`) | `siteSettings.brandLabel` | no schema field | ARIA labels excluded. |
| Footer | Footer description paragraph | `src/components/site-shell.tsx` | `siteSettings.footer.description` | no schema field | "Purpose-built competition shotguns..." |
| Footer | Footer columns (Explore/Support) and link lists | `src/components/site-shell.tsx` `primaryLinks`, `secondaryLinks` | `siteSettings.footer.columns[]` | missing in CMS | `footer.columns` is empty in Sanity. |
| Footer | Footer brand label ("Perazzi") | `src/components/site-shell.tsx` | `siteSettings.footer.brandLabel` | no schema field | Can share `siteSettings.brandLabel`. |
| Footer | Legal links (Privacy Policy, Terms) | `src/components/site-shell.tsx` `legalLinks` | `siteSettings.footer.legalLinks[]` | no schema field | Include label + href. |
| Footer | Address line ("Perazzi S.p.A - Botticino, Italy") | `src/components/site-shell.tsx` | `siteSettings.footer.addressLine` | no schema field | Footer lower rail. |
| Global CTA | CTASection heading ("Begin your fitting") | `src/components/shotguns/CTASection.tsx` | `siteSettings.ctaDefaults.heading` | no schema field | Shared CTA heading. |

## Routes - Core Site Pages
| Route | Content item | Current source | Sanity mapping | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | Hero tagline/subheading/background | `src/content/home/hero.ts` | `homeSingleton.hero` | already in CMS | Hero fields populated. |
| `/` | Hero CTAs (labels/prompts) | `src/sanity/queries/home.ts` fallback | `homeSingleton.heroCtas` | already in CMS | Hero CTAs populated. |
| `/` | Timeline framing + background | `src/sanity/queries/home.ts` fallback | `homeSingleton.timelineFraming` | already in CMS | Background image asset present. |
| `/` | Timeline stages (title/body/media) | `src/content/home/stages.ts` | `homeSingleton.timelineStages[]` | already in CMS | 11 stages in CMS. |
| `/` | Guide section + platform list | `src/sanity/queries/home.ts` fallback | `homeSingleton.guideSection` | already in CMS | Populated. |
| `/` | Marquee champion/inline + UI background | `src/content/home/champion.ts` + fallback UI | `homeSingleton.featuredChampion` or `homeSingleton.marqueeInline`, `homeSingleton.marqueeUi` | already in CMS | Both featuredChampion and marqueeInline set. |
| `/` | Finale CTA (text + 2 buttons) | `src/content/home/finale.ts` | `homeSingleton.finale` | missing in CMS | Finale fields are empty. |
| `/experience` | Page blocks (hero, picker, FAQ, mosaic) | `src/content/experience/*` | `experienceHome.hero`, `picker`, `pickerUi`, `faqSection`, `mosaicUi`, `mosaic` | already in CMS | All blocks populated. |
| `/experience` | Visit planning block | `src/content/experience/index.ts` | `experienceHome.visitPlanningBlock` | already in CMS | Populated. |
| `/experience` | Fitting guidance block | `src/content/experience/index.ts` | `experienceHome.fittingGuidanceBlock` | already in CMS | Populated. |
| `/experience` | Travel guide block | `src/content/experience/index.ts` | `experienceHome.travelGuideBlock` | already in CMS | Populated. |
| `/experience` | Visit factory section | `src/content/experience/visit.ts` | `experienceHome.visitFactorySection` | already in CMS | Background image asset present. |
| `/experience` | Booking section (options + scheduler labels) | `src/content/experience/index.ts` | `experienceHome.bookingSection` | already in CMS | Populated. |
| `/experience` | Booking background image | `src/components/experience/BookingOptions.tsx` | `experienceHome.bookingSection.backgroundImage` | no schema field | Uses `/Photos/p-web-89.jpg`. |
| `/experience` | FAQ background image | `src/components/experience/FAQList.tsx` | `experienceHome.faqSection.backgroundImage` | no schema field | Uses `/redesign-photos/experience/pweb-experience-faq-bg.jpg`. |
| `/experience` | Advisory right-title labels (3 strings) | `src/app/(site)/experience/page.tsx` | `experienceHome.visitPlanningBlock.rightTitle`, `fittingGuidanceBlock.rightTitle`, `travelGuideBlock.rightTitle` | no schema field | "What the concierge can..." labels. |
| `/experience` | Final CTA text + button labels | `src/content/experience/cta.ts` | `experienceHome.finalCta` | no schema field | CTA block at page bottom. |
| `/service` | Page blocks (hero, overview, guidance, network, maintenance, parts, integrity, requests, guides, FAQ) | `src/content/service/*` | `serviceHome.*` | already in CMS | Blocks populated. |
| `/service` | Service network locations | `src/content/service/locations.ts` | `recommendedServiceCenter` docs | already in CMS | 12 docs in CMS; verify mapping by state. |
| `/service` | Final CTA text | `src/app/(site)/service/page.tsx` | `serviceHome.finalCta.text` | no schema field | Hardcoded CTA text. |
| `/service` | Final CTA button labels | `src/content/service/cta.ts` | `serviceHome.finalCta.primary/secondary` | no schema field | Labels + hrefs. |
| `/heritage` | Page blocks (hero, intro, eras, workshop CTA, serial lookup UI, champions, factory, related) | `src/content/heritage/*`, `src/config/heritage-eras.ts` | `heritageHome.*` | already in CMS | Blocks populated; era backgrounds in CMS. |
| `/heritage` | Oral histories list | `src/content/heritage/oralHistories.ts` | `heritageHome.oralHistories[]` | missing in CMS | `oralHistories` count is 0. |
| `/heritage` | Serial lookup micro-labels (Serial Number, Tracing Lineage, Record Found, etc) | `src/components/heritage/SerialLookup.tsx` | `heritageHome.serialLookupUi.labels.*` | no schema field | System UI labels beyond existing fields. |
| `/bespoke` | Bespoke page blocks (hero, steps, guide, cinematic strips, experts, booking, assurance) | `src/content/build/*` | `bespokeHome.*` | already in CMS | Populated; cinematic alts present. |
| `/bespoke` | Footer CTA text + primary button | `src/content/build/footerCta.ts` | `bespokeHome.footerCta` | no schema field | No footer CTA field in schema. |
| `/bespoke` | Footer CTA secondary label | `src/app/(site)/bespoke/page.tsx` | `bespokeHome.footerCta.secondaryLabel` | no schema field | "Request a Visit". |
| `/shotguns` | Landing blocks (hero, platform grid, advisory blocks, trigger explainer, engraving carousel, teasers, discipline hubs) | `src/content/shotguns/landing.ts` | `shotgunsLanding.*` | already in CMS | All blocks populated. |
| `/shotguns` | Advisory right-title labels | `src/app/(site)/shotguns/page.tsx` | `shotgunsLanding.*.rightTitle` | no schema field | "Three rhythms...", "What to compare...", "What to Weigh...". |
| `/shotguns` | Discipline fit chat label ("Ask Perazzi") | `src/app/(site)/shotguns/page.tsx` | `shotgunsLanding.disciplineFitAdvisory.chatLabel` | no schema field | Field does not exist. |
| `/shotguns` | Final CTA text + button labels | `src/app/(site)/shotguns/page.tsx` | `shotgunsLanding.finalCta` | no schema field | CTA text and buttons. |
| `/shotguns/mx` etc | Platform guidance block (heading/body/chat label/prompt) | `src/app/(site)/shotguns/*.tsx` | `platform.guidance.*` | no schema field | Per-platform guidance copy. |
| `/shotguns/mx` etc | Platform page CTA text + button labels | `src/app/(site)/shotguns/*.tsx` | `platform.finalCta` | no schema field | CTA text and buttons. |
| `/shotguns/mx` etc | Platform series content (hero title/subheading, at-a-glance, storyHtml, discipline map, related articles) | `src/content/shotguns/series.*.ts` | `platform.*` (new fields) | no schema field | Existing platform fields cover hero image, highlights, champion, snippet, lineage. |
| `/shotguns/mx` etc | Platform existing fields (hero image, highlights, champion, snippet, lineage) | `src/content/shotguns/series.*.ts` | `platform.hero`, `platform.highlights`, `platform.champion`, `platform.snippet`, `platform.lineage` | already in CMS | 5 platform docs populated. |
| `/shotguns/disciplines/[slug]` | Discipline content (overview, hero, recommended platforms, popular models) | `src/content/shotguns/disciplines.ts` | `discipline.overview`, `discipline.hero`, `discipline.recommendedPlatforms`, `discipline.popularModels` | already in CMS | 7 discipline docs populated. |
| `/shotguns/disciplines/[slug]` | Discipline recipe, champion, related articles, overviewHtml | `src/content/shotguns/disciplines.ts` | `discipline.recipe`, `discipline.champion`, `discipline.articles`, `discipline.overviewHtml` | no schema field | New fields required. |
| `/shotguns/disciplines/[slug]` | Marquee fallback text | `src/app/(site)/shotguns/disciplines/[slug]/page.tsx` | `discipline.marqueeFallbackText` | no schema field | Hardcoded fallback line. |
| `/shotguns/disciplines/[slug]` | CTA text + button labels | `src/app/(site)/shotguns/disciplines/[slug]/page.tsx` | `discipline.finalCta` | no schema field | CTA text and buttons. |
| `/shotguns/gauges` | Gauge list data (label, description, handling notes, barrels, disciplines, FAQ) | `src/content/shotguns/gauges.ts` | `gauge.*` (new fields) | no schema field | Current schema only has name + handlingNotes. |
| `/shotguns/gauges` | Page hero/editorial/sidebar/FAQ | `src/content/shotguns/gauges-content.ts` | `shotgunsGaugesPage.*` | no schema field | New doc type. |
| `/shotguns/gauges` | Sidebar title ("Pattern & POI") | `src/app/(site)/shotguns/gauges/page.tsx` | `shotgunsGaugesPage.sidebarTitle` | no schema field | Hardcoded label. |
| `/shotguns/gauges` | CTA text + button labels | `src/app/(site)/shotguns/gauges/page.tsx` | `shotgunsGaugesPage.finalCta` | no schema field | CTA text + buttons. |
| `/shotguns/grades` | Page hero/provenance/process note | `src/content/shotguns/grades-content.ts` | `shotgunsGradesPage.*` | no schema field | New doc type. |
| `/shotguns/grades` | Grade description + hero image | `src/content/shotguns/grades.ts` | `grade.description`, `grade.hero` | missing in CMS | Descriptions partial (13/23). |
| `/shotguns/grades` | Grade engraving gallery + wood images | `src/content/shotguns/grades.ts` | `grade.engravingGallery`, `grade.woodImages` | missing in CMS | Both empty across 23 grades. |
| `/shotguns/grades` | Grade provenance + options | `src/content/shotguns/grades.ts` | `grade.provenanceHtml`, `grade.options` | no schema field | New fields required. |
| `/shotguns/grades` | CTA text + button labels | `src/app/(site)/shotguns/grades/page.tsx` | `shotgunsGradesPage.finalCta` | no schema field | CTA text + buttons. |
| `/journal` | Landing hero + featured article | `src/content/journal/landing.ts` | `journalLanding.hero`, `journalLanding.featuredArticle` | already in CMS | `journalLanding` populated. |
| `/journal` | Journal hero label ("Journal") | `src/components/journal/JournalHero.tsx` | `journalLanding.hero.label` or `siteSettings.journalUi.heroLabel` | no schema field | Label is hardcoded. |
| `/journal` | Journal search labels + placeholder + button | `src/components/journal/JournalSearch.tsx` | `siteSettings.journalUi.search.*` | no schema field | Includes "Search the journal", placeholder, "Search". |
| `/journal` | Newsletter signup labels + confirmation | `src/components/journal/NewsletterSignup.tsx` | `siteSettings.journalUi.newsletter.*` | no schema field | Includes heading, body, button, success text. |
| `/journal/[slug]` | Empty-state title + SEO fallback description | `src/app/(site)/journal/[slug]/page.tsx` | `articleDefaults.*` or `journalLanding.defaults.*` | no schema field | New defaults needed. |
| `/journal/stories-of-craft` etc | Category header (title/subtitle/featured) | `src/content/journal/categories/*` | `journalCategory.*` | no schema field | New doc type. |
| `/journal/stories-of-craft` etc | Category header labels ("Journal", "Featured:") | `src/components/journal/CategoryHeader.tsx` | `journalCategory.ui.*` or `siteSettings.journalUi.*` | no schema field | UI labels. |
| `/engravings` | Hero label/title/description + hero image | `src/app/(site)/engravings/page.tsx` | `engravingSearchPage.hero` | no schema field | New doc type. |
| `/engravings` | SEO title/description | `src/app/(site)/engravings/page.tsx` | `engravingSearchPage.seo` | no schema field | New doc type. |
| `/shotguns/all` | Hero label/title/description + hero image | `src/app/(site)/shotguns/all/page.tsx` | `modelSearchPage.hero` | no schema field | New doc type. |
| `/shotguns/all` | SEO title/description | `src/app/(site)/shotguns/all/page.tsx` | `modelSearchPage.seo` | no schema field | New doc type. |
| `/fschat` | Header label/title/description | `src/app/(site)/fschat/page.tsx` | `fullScreenChatPage.header` | no schema field | New doc type. |
| `/fschat` | SEO title/description | `src/app/(site)/fschat/page.tsx` | `fullScreenChatPage.seo` | no schema field | New doc type. |
| `/concierge` | Hero eyebrow/title/subheading/background/bullets | `src/app/(site)/concierge/page.tsx` | `conciergePage.hero` | no schema field | New doc type. |
| `/concierge` | Concierge drawer UI labels | `src/components/concierge/SanityDetailsDrawer.tsx` | `conciergeUi.*` | no schema field | Excludes error messages; includes loading/empty/view more/close labels. |
| `/bespoke-build` | Page heading + body copy | `src/app/(site)/bespoke-build/page.tsx` | `bespokeBuildLanding.*` | no schema field | Placeholder copy. |
| `/bespoke-build/[stage]` | Stage title/description/body | `src/app/(site)/bespoke-build/[stage]/page.tsx` | `bespokeBuildStage.*` | no schema field | One doc per stage slug. |
| `/heritage/[section]` | Section title/description/body | `src/app/(site)/heritage/[section]/page.tsx` | `heritageSection.*` | no schema field | One doc per section slug. |
| `/the-build/why-a-perazzi-has-a-soul` | Intro label/title/body | `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx` | `buildJourneyLanding.*` | no schema field | External API responses excluded. |

## Assets and Background Images (Non-CMS Paths or Remote URLs)
| Asset | Usage | Sanity mapping | Status | Notes |
| --- | --- | --- | --- | --- |
| `/Photos/p-web-d-2.jpg` | Engravings hero image | `engravingSearchPage.hero.image` | no schema field | New doc required. |
| `/Photos/olympic-medals-1.jpg` | Model search hero image | `modelSearchPage.hero.image` | no schema field | New doc required. |
| `/Photos/p-web-89.jpg` | Experience booking background | `experienceHome.bookingSection.backgroundImage` | no schema field | Field missing. |
| `/images/p-web-d-25.jpg` | Build journey hero | `buildJourneyLanding.hero.image` | no schema field | New doc required. |
| `/redesign-photos/p-web-20.jpg` | Concierge hero background | `conciergePage.hero.background` | no schema field | New doc required. |
| `/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg` | Home timeline background | `homeSingleton.timelineFraming.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg` | Home marquee background | `homeSingleton.marqueeUi.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg` | Shotguns platform grid background | `shotgunsLanding.platformGridUi.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg` | Shotguns discipline rail background | `shotgunsLanding.disciplineRailUi.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg` | Trigger explainer background | `shotgunsLanding.triggerExplainer.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg` | Engraving carousel background | `shotgunsLanding.engravingCarouselUi.backgroundImage.image` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/bespoke/pweb-bespoke-buildstepscroller-bg.jpg` | Bespoke steps background | `bespokeHome.stepsIntro.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/experience/pweb-experience-experiencepicker-bg.jpg` | Experience picker background | `experienceHome.pickerUi.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/experience/pweb-experience-faq-bg.jpg` | Experience FAQ background | `experienceHome.faqSection.backgroundImage` | no schema field | Component uses static path. |
| `/redesign-photos/experience/pweb-experience-visitfactory-bg.jpg` | Visit factory background | `experienceHome.visitFactorySection.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg` | Travel network background | `experienceHome.travelNetworkUi.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/heritage/perazzi-legacy-lives-on.jpg` | Heritage intro background | `heritageHome.heritageIntro.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/redesign-photos/heritage/pweb-heritage-era-*.jpg` | Heritage era backgrounds | `heritageHome.erasConfig[].backgroundImage` | already in CMS | All 5 era images in CMS. |
| `/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg` | Champions gallery background | `heritageHome.championsGalleryUi.backgroundImage` | already in CMS | Image asset present in CMS. |
| `/cinematic_background_photos/p-web-25.jpg` | Bespoke cinematic strip 1 | `bespokeHome.cinematicStrips[0].image` | already in CMS | 2 cinematic strips populated. |
| `/cinematic_background_photos/p-web-16.jpg` | Bespoke cinematic strip 2 | `bespokeHome.cinematicStrips[1].image` | already in CMS | 2 cinematic strips populated. |
| `/cinematic_background_photos/p-web-2.jpg` | Heritage serial lookup background | `heritageHome.serialLookupUi.backgroundImage` | already in CMS | Serial lookup background present. |
| Cloudinary fetch / Unsplash URLs | Home factory assets | `homeSingleton.hero/background`, `homeSingleton.timelineStages`, `homeSingleton.marqueeInline` | missing in CMS | Currently referenced via remote URLs in fixtures. Upload to Sanity assets to remove URL dependency. |
| Cloudinary fetch / Unsplash URLs | Shotguns series images (platforms, highlights, champions) | `platform.hero`, `platform.highlights`, `platform.champion` | missing in CMS | Fixtures use remote URLs; migrate to CMS assets. |
| Cloudinary fetch / Unsplash URLs | Discipline hero + champion images | `discipline.hero`, `discipline.champion` | missing in CMS | Fixtures use remote URLs; migrate to CMS assets. |
| Cloudinary fetch / Unsplash URLs | Grades gallery images | `grade.engravingGallery`, `grade.woodImages` | missing in CMS | Galleries empty in CMS. |
| Cloudinary fetch / Unsplash URLs | Gauges hero background | `shotgunsGaugesPage.hero.background` | no schema field | New doc required. |
| Cloudinary fetch / Unsplash URLs | Grades hero background | `shotgunsGradesPage.hero.background` | no schema field | New doc required. |

## Notes
- Admin routes, ARIA labels, and error messages are excluded by design.
- "already in CMS" indicates the field is populated in Sanity; content parity with fixture copy still needs verification during Phase 5.
- "missing in CMS" items are immediate content entry targets without schema changes.
- "no schema field" items require schema additions in Phase 3 before migration.
