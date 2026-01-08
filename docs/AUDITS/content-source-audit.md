# Content Source Audit

Generated at: 2026-01-07T21:08:27-06:00
Repo: /Users/davidradulovich/perazzi-site (branch main, commit 2f8a0f6ac1946e194c97c6ccee0b09e8903b43b8)

## Executive summary
- Routes audited: 37. Hybrid 31 (83.8%), hardcoded 4 (10.8%), CMS-only 2 (5.4%).
- Primary content system is Sanity (GROQ queries and schema definitions under `sanity/` and `src/sanity/`).
- Local fixtures and config provide fallback and navigation copy (`src/content/`, `src/config/`, `src/messages/en.json`).
- Non-CMS backends include Postgres for admin dashboards and OpenAI for concierge/build-journey responses.
- No MD or MDX content files detected under `src/`.

## Detected content integrations
- Sanity (cms). Evidence: `sanity/client.ts`, `src/sanity/lib/client.ts`, `src/sanity/lib/live.ts`, `src/sanity/lib/image.ts`; schemas: `sanity/schemas`, `src/sanity/schemaTypes`; queries: groq; env: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_READ_TOKEN, SANITY_READ_TOKEN, SANITY_STUDIO_TOKEN, NEXT_PUBLIC_SANITY_BROWSER_TOKEN; notes: Sanity Studio mounted at /next-studio and /debug-studio; GROQ queries live in src/sanity/queries/**.
- Local content fixtures (local_content). Evidence: `src/content`, `src/config/heritage-eras.ts`, `src/messages/en.json`; queries: other; notes: Static TS/JSON fixtures used as defaults when CMS data is missing or for placeholder pages.
- Postgres (pg/pgvector) (db). Evidence: `src/lib/db.ts`, `src/lib/pgpt-insights/queries.ts`, `src/lib/perazzi-retrieval.ts`, `src/app/admin/pgpt-insights/qa/page.tsx`; schemas: `sql`; queries: sql; env: DATABASE_URL, PGSSL_MODE, PG_CA_CERT_PEM; notes: Backs PGPT Insights dashboards and retrieval/search for the assistant.
- OpenAI Responses/Embeddings (unknown). Evidence: `src/lib/aiClient.ts`, `src/app/api/perazzi-assistant/route.ts`, `src/app/api/soul-journey-step/route.ts`; queries: other; env: OPENAI_API_KEY, AI_GATEWAY_URL, AI_GATEWAY_TOKEN, AI_FORCE_DIRECT, PERAZZI_MODEL, PERAZZI_ASSISTANT_TEMPERATURE, PERAZZI_REASONING_EFFORT, PERAZZI_TEXT_VERBOSITY, PERAZZI_PROMPT_CACHE_RETENTION, PERAZZI_PROMPT_CACHE_KEY; notes: External API used to generate concierge and build-journey responses.

## Route coverage
| Route | Classification | CMS models/queries | Entry file |
| --- | --- | --- | --- |
| `/` | hybrid | homeSingleton, champion, article, homeQuery, getHome | `src/app/(site)/page.tsx` |
| `/engravings` | hybrid | engravings, grade, engravingsQuery | `src/app/(site)/engravings/page.tsx` |
| `/experience` | hybrid | experienceHome, scheduledEvent, authorizedDealer, recommendedServiceCenter, getExperienceHome, experienceNetworkQuery, getExperienceNetworkData | `src/app/(site)/experience/page.tsx` |
| `/fschat` | hybrid | /api/perazzi-assistant | `src/app/(site)/fschat/page.tsx` |
| `/service` | hybrid | serviceHome, recommendedServiceCenter, getServiceHome, getRecommendedServiceCenters, getServicePageData | `src/app/(site)/service/page.tsx` |
| `/concierge` | hybrid | engravings, buildConfigurator, /api/engravings, /api/build-info, /api/perazzi-assistant | `src/app/(site)/concierge/page.tsx` |
| `/bespoke-build` | hardcoded | - | `src/app/(site)/bespoke-build/page.tsx` |
| `/heritage` | hybrid | heritageHome, heritageEvent, champion, manufactureYear, getHeritageHome, getHeritageEvents, getHeritageChampions, getManufactureYearBySerial, getHeritagePageData | `src/app/(site)/heritage/page.tsx` |
| `/bespoke` | hybrid | bespokeHome, getBespokeHome, getBespokePageData | `src/app/(site)/bespoke/page.tsx` |
| `/shotguns/gauges` | hybrid | - | `src/app/(site)/shotguns/gauges/page.tsx` |
| `/shotguns/all` | hybrid | allModels, platform, grade, modelsQuery | `src/app/(site)/shotguns/all/page.tsx` |
| `/shotguns` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsLanding, getPlatforms, getDisciplines, getGrades, getShotgunsSectionData | `src/app/(site)/shotguns/page.tsx` |
| `/bespoke-build/[stage]` | hardcoded | - | `src/app/(site)/bespoke-build/[stage]/page.tsx` |
| `/journal/[slug]` | hybrid | article, author, getArticles, getJournalArticleData, getJournalArticleSlugs | `src/app/(site)/journal/[slug]/page.tsx` |
| `/heritage/[section]` | hardcoded | - | `src/app/(site)/heritage/[section]/page.tsx` |
| `/admin/pgpt-insights/session` | hardcoded | - | `src/app/admin/pgpt-insights/session/page.tsx` |
| `/shotguns/mx` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsSectionData | `src/app/(site)/shotguns/mx/page.tsx` |
| `/shotguns/grades` | hybrid | grade, getGrades, getShotgunsSectionData | `src/app/(site)/shotguns/grades/page.tsx` |
| `/shotguns/ht` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsSectionData | `src/app/(site)/shotguns/ht/page.tsx` |
| `/journal/stories-of-craft` | hybrid | getJournalCategoryData | `src/app/(site)/journal/stories-of-craft/page.tsx` |
| `/the-build/why-a-perazzi-has-a-soul` | hybrid | article, BUILD_JOURNEY_QUERY, /api/soul-journey-step | `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx` |
| `/journal` | hybrid | journalLanding, article, getJournalLanding, getJournalLandingData | `src/app/(site)/journal/page.tsx` |
| `/admin/pgpt-insights/session/[sessionId]` | hybrid | fetchSessionLogsPreview, fetchSessionConversationLogs, fetchSessionTimelineRows | `src/app/admin/pgpt-insights/session/[sessionId]/page.tsx` |
| `/admin/pgpt-insights` | hybrid | fetchLogs, getOpenQaFlagCount | `src/app/admin/pgpt-insights/page.tsx` |
| `/shotguns/tm` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsSectionData | `src/app/(site)/shotguns/tm/page.tsx` |
| `/shotguns/dc` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsSectionData | `src/app/(site)/shotguns/dc/page.tsx` |
| `/shotguns/sho` | hybrid | shotgunsLanding, platform, discipline, grade, getShotgunsSectionData | `src/app/(site)/shotguns/sho/page.tsx` |
| `/journal/champion-interviews` | hybrid | getJournalCategoryData | `src/app/(site)/journal/champion-interviews/page.tsx` |
| `/shotguns/disciplines/[slug]` | hybrid | discipline, platform, grade, getDisciplines, getShotgunsSectionData | `src/app/(site)/shotguns/disciplines/[slug]/page.tsx` |
| `/admin/pgpt-insights/templates` | hybrid | getTemplateUsageHeatmap | `src/app/admin/pgpt-insights/templates/page.tsx` |
| `/admin/pgpt-insights/qa` | hybrid | fetchOpenCount, fetchQaFlags | `src/app/admin/pgpt-insights/qa/page.tsx` |
| `/admin/pgpt-insights/quality` | hybrid | getLowMarginSessions | `src/app/admin/pgpt-insights/quality/page.tsx` |
| `/journal/news` | hybrid | getJournalCategoryData | `src/app/(site)/journal/news/page.tsx` |
| `/admin/pgpt-insights/triggers` | hybrid | getTriggerTermWeeks, getTriggerTermsForWeek | `src/app/admin/pgpt-insights/triggers/page.tsx` |
| `/admin/pgpt-insights/archetype` | hybrid | getArchetypeDailySeries, getArchetypeMarginSummary, getArchetypeVariantSplit | `src/app/admin/pgpt-insights/archetype/page.tsx` |
| `/debug-studio/[[...tool]]` | cms | - | `src/app/debug-studio/[[...tool]]/page.tsx` |
| `/next-studio/[[...tool]]` | cms | - | `src/app/next-studio/[[...tool]]/page.tsx` |

## Component content inventory
| Component | Classification | Major content props / internal copy |
| --- | --- | --- |
| `SiteShell` | hybrid | children |
| `PrimaryNav` | hybrid | brandLabel, ariaLabel |
| `HeroBanner` | hybrid | hero, heroCtas |
| `CTASection` | hybrid | text, primary, secondary |
| `SerialLookup` | hybrid | ui, lookupAction |
| `ChatWidget` | presentational | openButton.ariaLabel |
| `AdminPageHeader` | hybrid | breadcrumb, title, description, kicker |
| `JournalHero` | hybrid | hero, breadcrumbs |
| `CategoryHeader` | hybrid | header |
| `SanityDetailsDrawer` | hybrid | cards, selectedCard, error |

## Hardcoded hotspots (ranked)
| Priority | Location | Excerpt | Suggested CMS model/fields |
| --- | --- | --- | --- |
| 1 | `src/app/(site)/shotguns/page.tsx`:12-18 | heading: "The geometry of rhythm" ... fallback paragraphs in disciplineFit | shotgunsLanding (disciplineFitAdvisory.eyebrow, disciplineFitAdvisory.heading, disciplineFitAdvisory.paragraphs, disciplineFitAdvisory.chatPrompt) |
| 2 | `src/app/(site)/experience/page.tsx`:78-96 | visitPlanningBlock fallback copy for heading/intro/bullets/closing | experienceHome (visitPlanningBlock.heading, visitPlanningBlock.intro, visitPlanningBlock.bullets, visitPlanningBlock.closing, visitPlanningBlock.chatPrompt) |
| 3 | `src/app/(site)/heritage/page.tsx`:90-98 | heritageIntroHeading fallback and paragraphs array | heritageHome (heritageIntro.heading, heritageIntro.eyebrow, heritageIntro.paragraphs) |
| 4 | `src/app/(site)/service/page.tsx`:67-76 | serviceGuidanceBlock fallback body + chat prompt | serviceHome (serviceGuidanceBlock.eyebrow, serviceGuidanceBlock.body, serviceGuidanceBlock.chatPrompt) |
| 5 | `src/components/site-shell.tsx`:27-38 | primaryLinks and secondaryLinks arrays define main nav labels/URLs | siteSettings (primaryNav, secondaryNav, footerDescription, legalLinks) |
| 6 | `src/app/(site)/concierge/page.tsx`:4-28 | conciergeHero title/subheading/bullets hardcoded | conciergeHome (hero.eyebrow, hero.title, hero.subheading, hero.bullets) |
| 7 | `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx`:75-83 | IntroSection label/title/paragraph copy | buildJourneyLanding (intro.label, intro.title, intro.body) |
| 8 | `src/app/(site)/bespoke-build/[stage]/page.tsx`:5-20 | stageCopy titles/descriptions/bodies are static placeholders | bespokeBuildStage (title, description, body, media) |

## Fast wins
- Move site navigation and footer labels to CMS or a dedicated config model (currently hardcoded in `src/components/site-shell.tsx`).
- Replace marketing fallback paragraphs on `/shotguns`, `/experience`, `/heritage`, `/service` with CMS fields to avoid drift from Sanity content.
- Convert concierge hero copy to CMS fields so it can be updated without code deploys.
- Model bespoke build stages in Sanity and replace the static `stageCopy` map.
- Centralize repeated CTA labels ("Begin Your Fitting", "Request a Visit") into a shared CMS or config resource.
- Normalize SEO metadata: move static page metadata into CMS where possible and add fields to article records (title, description, og image).
- Audit `src/content/` fixtures and remove deprecated copy once CMS coverage is complete.

## Risks and edge cases
- Many routes are hybrid due to Sanity data merged with local fixtures; missing CMS data silently falls back to hardcoded copy, which can mask content gaps.
- SEO metadata is partly hardcoded (`src/app/layout.tsx`, page-level `metadata` objects) and partly CMS-driven (`/journal/[slug]`), which can lead to inconsistent titles/descriptions.
- External API responses (OpenAI) generate user-facing content at runtime without editorial review or versioning.
- Admin dashboards read from Postgres; labels and navigation copy in admin layout are hardcoded and not localized.
- Localization appears limited to `src/messages/en.json`; no other locale files were found.
- Hardcoded canonical URL base in `/journal/[slug]` uses `https://perazzi.example`, which may not match production domains.

## Next actions
1) Confirm the Sanity content model for shared UI copy (nav, footer, CTAs) and add fields for current hardcoded strings.
2) Add CMS fields for bespoke build stages and migrate `stageCopy` content into Sanity.
3) Decide on a single source of truth for SEO metadata (CMS vs code) and standardize page-level metadata.
4) Review OpenAI-generated content surfaces for caching and editorial guardrails if the output is considered publishable.
5) Expand locale support if multi-language is required; otherwise document that content is English-only.
