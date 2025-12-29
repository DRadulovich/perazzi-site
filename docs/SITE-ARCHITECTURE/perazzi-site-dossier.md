# Perazzi Site — Architecture & Tech Stack Dossier

1. Executive Summary
   - Next.js 16 app-router build with server components, Tailwind v4, and Framer Motion delivering a cinematic, scroll-led brand story backed by structured CMS content.
   - Sanity powers all core narratives (home hero, craftsmanship timeline, champions, platforms, service network), with JSON fixtures as resilient fallbacks so pages stay up even if the CMS is down.
   - Perazzi Concierge pairs a rules-based build navigator with an AI assistant: OpenAI + pgvector search over curated Perazzi knowledge and model specs, exposed via a Next.js API route.
   - Media is Cloudinary-optimized and streamed through `next/image`, with preconnects and remote image patterns to keep LCP low while maintaining art direction.
   - Accessibility and performance are first-class: skip links, focus traps, `prefers-reduced-motion` paths, semantic headings, and observation-based analytics hooks throughout the hero → timeline → marquee flow.

2. Tech Stack Overview
   2.1 Front-end Framework & Runtime  
   - Next.js 16 (app router, server components), React 19.2, TypeScript 5; Node 18+ target via Next defaults.  
   - next-intl for locale resolution (currently `en` only) and request-scoped message loading; middleware reads `locale` query to set `x-active-locale`.  
   - Vercel Analytics client injected in the site shell; build/start scripts are standard `next build` / `next start`.
   - Rendering: routes use server data-fetching; no custom `dynamic` flags beyond `next-studio` (forced static). Sanity fetches use CDN in production; React `cache()` memoizes results to encourage static generation where possible.

   2.2 Styling & Design System  
   - Tailwind CSS v4 with inline design tokens in `src/styles/site-theme.css` (imported by `src/app/globals.css`); typography via Geist (sans/mono) plus Playfair Display for serif accents.  
   - Custom CSS variables for Perazzi palette, spacing scales, focus rings, scrims, and semantic helpers (`bg-canvas`, `text-ink-muted`).  
   - Radix UI primitives (Dialog, Tooltip, Collapsible, Slot) underpin accessible overlays/tooltips.  
   - class-variance-authority, clsx utilities; occasional styled-components within Sanity Studio ecosystem.

   2.3 Content & Data Layer  
   - Sanity CMS via `next-sanity` client; main schemas: `homeSingleton`, `platform`, `discipline`, `grade`, `champion`, `heritageEvent`, `experienceHome`, `serviceHome`, `journalLanding`, `article`, `authorizedDealer`, `recommendedServiceCenter`, `manufactureYear`, `engravings`, `allModels`, `buildConfigurator`.  
   - Static JSON/TS fixtures in `src/content/**` provide defaults for home, shotguns, heritage, experience, service, journal, build steps if Sanity is unavailable.  
   - pg + pgvector back knowledge base for the Perazzi assistant; ingestion scripts (`scripts/ingest.ts`, `docker-compose.vector.yml`) load chunked content and embeddings.

   2.4 Media & Assets  
   - Cloudinary fetch URLs with auto-format/quality for most hero and gallery media; `CLOUDINARY_CLOUD_NAME` optionally overrides the cloud.  
   - `next/image` with remote patterns for Cloudinary, `cdn.sanity.io`, and `perazzi.it`; head preconnects to Cloudinary.  
   - Sanity `imageWithMeta` fields and `getSanityImageUrl` helper normalize alt text/aspect ratios; `next-sanity` image builder used in engravings and configurator drawers.

   2.5 Integrations & External Services  
   - **Sanity**: primary CMS + Studio mounted at `/next-studio`; GROQ queries in `src/sanity/queries/**`.  
   - **OpenAI**: chat completions + embeddings for Perazzi Concierge (`/api/perazzi-assistant`) and ingest scripts.  
   - **Postgres + pgvector**: similarity search over curated chunks; connection via `pg` + `pgvector/pg`.  
   - **Cloudinary CDN**: media transformation/delivery for imagery and downloads.  
   - **Vercel Analytics**: client-side event capture.  
   - **No auth layer yet** (no NextAuth/Supabase auth present).

   Dependency snapshots by purpose  
   - Core: `next@16.0.1`, `react@19.2.0`, `react-dom@19.2.0`, `next-intl@4.4.0`.  
   - Styling/DS: `tailwindcss@4`, `@tailwindcss/typography@0.5.19`, Radix UI packages (`@radix-ui/react-dialog` et al.), `class-variance-authority`, `clsx`.  
   - Animation/interaction: `framer-motion@12.23.24`, `react-use-measure`.  
   - Content/data: `sanity@4.14.2`, `next-sanity@11`, `@sanity/client@7.12.1`, `groq`, `react-markdown`, `remark-gfm`, `rehype-sanitize`.  
   - AI/RAG: `openai@6.9.1`, `@dqbd/tiktoken`, `pg@8.16.3`, `pgvector@0.2.1`.  
   - Media: `@sanity/image-url`, `next/image` Cloudinary remote patterns.  
   - Analytics: `@vercel/analytics@1.5.0`.  
   - Tooling: `typescript@5`, `eslint@9` with Next core-web-vitals config, `vitest@4` + coverage/UI, `tsx` runner, `babel-plugin-react-compiler`.

3. Application Architecture & Key Experiences
   - Top-level routes (server components unless noted): `/` (home), `/shotguns` plus `/shotguns/{ht,mx,dc,sho,tm,gauges,grades,all}`, `/heritage`, `/experience`, `/bespoke`, `/service`, `/concierge`, `/engravings`, `/journal` (category hubs + `[slug]` articles), `/next-studio` (Sanity Studio), `/ui-test-gallery` and `/perazzi-ui-*` (demo pages).
   - Home (`src/app/page.tsx`): Cinematic hero → pinned Craftsmanship Timeline → concierge guidance block → Champion marquee → Finale CTA. Content from `getHome` (Sanity `homeSingleton`) with fallbacks; Framer Motion parallax, focus-trapped manifesto overlay, skip link for timeline, `prefers-reduced-motion` branches, analytics observers per section.
   - Shotguns landing + platform detail: `getShotgunsSectionData` merges Sanity (`shotgunsLanding`, `platform`, `discipline`, `grade`) with fixtures. Landing uses `LandingHero`, `PlatformGrid`, `DisciplineRail`, `TriggerExplainer`, Cloudinary-backed cinematic strips, engraving carousel, concierge CTAs. Platform pages (HT/MX/DC/SHO/TM) map Sanity platform highlights into `SeriesHero`, `AtAGlanceStrip`, `DisciplineMap`, `MarqueeFeature`, with chat prompts tailored via `buildPlatformPrompt`.
   - Heritage: `getHeritagePageData` (Sanity `heritageHome`, `heritageEvent`, `champion`) powers hero, `BrandTimeline`, `ChampionsGallery`, `FactoryPhotoEssay`, `OralHistories`. Serial lookup server action + `/api/serial-lookup` uses Sanity `manufactureYear` ranges to return year/proof code/model hints. CTA uses shared design system.
   - Experience: `getExperiencePageData` + `getExperienceNetworkData` (Sanity `experienceHome`, `scheduledEvent`, `authorizedDealer`, `recommendedServiceCenter`). Components: `ExperienceHero`, `ExperiencePicker`, travel/visit guidance, booking embeds, factory visit CTA, FAQ schema JSON-LD.
   - Bespoke: `getBespokePageData` (Sanity `bespokeHome`) informs `BuildHero`, `JourneyOverview`, `BuildStepsScroller`, expert cards, booking options, assurance block, cinematic strips.
   - Service: `getServicePageData` (Sanity `serviceHome` + service centers) feeds `ServiceHero`, network finder, maintenance guides, parts/editorial, Calendly embeds with fallbacks, FAQ schema, CTA.
   - Concierge: Marketing hero plus `ConciergePageShell` client experience that synchronizes the build navigator and AI assistant. Uses rule-based gun-order config (`PerazziGPT/Gun_Info`) + Sanity build-configurator data via `/api/build-info` and OpenAI answers from `/api/perazzi-assistant`. Provides dealer-ready briefs (`buildDealerBriefRequest`) and Sanity-powered drawers for imagery/specs.
   - Engravings: `/engravings` queries Sanity `engravings` for searchable table; hero image from local `Photos` folder, server-rendered gallery. `/api/engravings` exposes filtered search by id or grade.
   - Journal: Landing pulls `journalLanding` (featured story overrides) plus category/tag metadata from fixtures; articles from `getArticles` hydrate fallback stories. Category hubs (`/journal/stories-of-craft`, `/champion-interviews`, `/news`) reuse shared components; `[slug]` renders markdown/Portable Text with Cloudinary hero, SEO metadata.
   - Next Studio: `/next-studio/[[...tool]]` serves Sanity Studio with desk structure defined in `src/sanity/structure.ts`, forced static export to keep authoring isolated from runtime.

4. Performance, Accessibility & Reliability
   - Core Web Vitals aids: `next/image` with defined aspect ratios and remote patterns; Cloudinary `f_auto,q_auto` transforms; head preconnect to Cloudinary; parallax/scroll animations gated behind `prefers-reduced-motion` and disabled on mobile via media queries; page sections instrumented with IntersectionObserver for lazy analytics rather than heavy JS.
   - Code-splitting via server components; data fetching wrapped in `cache()` to avoid duplicate calls; fixtures ensure SSG viability when CMS is slow; Sanity client uses CDN in production.
   - Accessibility: global skip link, focus-ring utilities, semantic headings, aria labels for scroll/pinned sections, focus traps in hero manifesto dialog, skip targets for timelines, keyboard-friendly controls, `prefers-reduced-motion` fallbacks for Framer Motion, prose styled for legibility and WCAG-friendly contrast tokens.
   - Internationalization: next-intl with locale inference (`x-active-locale` header via middleware); single-locale (`en`) today but ready for locale expansion in `src/i18n`.
   - Resilience: try/catch around all Sanity fetches with console warnings and fixture fallbacks; API routes validate input and return explicit errors; assistant blocks pricing/gunsmithing/legal topics and returns low-confidence messaging; serial lookup sanitizes input server-side; ingestion scripts support SSL and retry-safe Postgres config.

5. Security & Secrets Handling (high-level only)
   - Environment variables (names only): `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `SANITY_WRITE_TOKEN`/`SANITY_AUTH_TOKEN`/`SANITY_TOKEN`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `CLOUDINARY_CLOUD_NAME`, `OPENAI_API_KEY`, `PERAZZI_COMPLETIONS_MODEL`, `PERAZZI_MAX_COMPLETION_TOKENS`, `PERAZZI_LOW_CONF_THRESHOLD`, `PERAZZI_ENABLE_FILE_LOG`, `PERAZZI_EMBED_MODEL`, `PERAZZI_RETRIEVAL_LIMIT`, `PERAZZI_MIN_SIMILARITY`, `PGVECTOR_TABLE`, `DATABASE_URL`, `PGSSL_MODE`, `PGVECTOR_DIM`, `PGVECTOR_OP_CLASS`, `EMBED_BATCH_SIZE`, `DEBUG_CHUNK_DOC`.  
   - Usage: Sanity project/dataset/token configure CMS access; Cloudinary name selects media cloud; OpenAI + PERAZZI_* tune assistant models/limits/guardrails; pgvector/DATABASE_URL/PGSSL_MODE configure embeddings store; public NEXT_PUBLIC_* expose read-only Sanity settings to Studio/client; no secrets are logged.

6. Differentiators vs. a Conventional WordPress Site
   - Headless split: presentation in Next.js server components; structured content in Sanity (typed schemas for platform, discipline, grade, heritage events, configurator steps) rather than WYSIWYG blobs.
   - Dynamic storytelling components (parallax hero, pinned craftsmanship timeline, champion marquee, cinematic strips) built with Framer Motion and responsive media queries, not static page templates.
   - AI-assisted concierge: bespoke build navigator synced with an OpenAI + pgvector RAG service over Perazzi-authored knowledge, including guardrails and citation mapping—far beyond a plugin chatbot.
   - Cloudinary-optimized media pipeline with preconnects and aspect-ratio aware `next/image` usage; Sanity asset metadata drives alt text and captions.
   - Performance/accessibility baked in: skip links, focus management, reduced-motion fallbacks, schema.org FAQ JSON-LD, analytics observers; fixture fallbacks keep pages available if CMS is unreachable.
   - Modern delivery: Vercel-oriented build with CDN-backed Sanity reads, static-friendly data caching, and isolated Sanity Studio at `/next-studio`.

7. Open Questions & TODOs
   - Confirm deployment target (assumed Vercel) and whether ISR/tag-based revalidation should be enabled for Sanity content updates.
   - Decide on analytics destination beyond Vercel dev logging (GA4/Segment/etc.) and wire real event transport.
   - Auth/user state is absent; if gated concierge features are planned, choose auth provider and persistence strategy for saved builds.
   - Clarify SEO plan for legal/privacy pages (currently TODO links) and for test/demo routes (`/perazzi-ui-*`) before launch.
