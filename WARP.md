# WARP.md
This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Setup
- Package manager: `pnpm` (lockfile present). Install deps with `pnpm install`.
- Copy `.env.example` to `.env.local`; required values include Sanity IDs/tokens, `OPENAI_API_KEY` (or `AI_GATEWAY_URL`/`AI_GATEWAY_TOKEN`), `DATABASE_URL` + `PGSSL_MODE`, `CLOUDINARY_CLOUD_NAME`, and `PERAZZI_*` toggles that steer the assistant/RAG behavior.
- Vector DB for local RAG: `scripts/dev-vector-db.sh up` (uses `docker-compose.vector.yml` for Postgres + pgvector on :5433); `down`/`logs` to stop/inspect.

## Core commands
- Dev server: `pnpm dev` (Next.js app router; includes site routes and `/next-studio`).
- Build/serve: `pnpm build` then `pnpm start`.
- Lint/typecheck: `pnpm lint`, `pnpm typecheck`.
- Tests (Vitest): `pnpm test`. Run one test: `pnpm vitest tests/lib/perazzi-retrieval.test.ts -t "reranks top hit"` (or any file/name); watch mode `pnpm vitest --watch`.
- RAG ingestion (PGPT v2 corpus): `pnpm ingest:v2 -- --audit` (read-only), `pnpm ingest:v2:dry-run`, `pnpm ingest:v2:full`.
- Retrieval regression harness: `pnpm perazzi:eval:retrieval --k 12 --rerank on --candidate-limit 60 --json tmp/retrieval-report.json`.
- Assistant smoke check: `pnpm tsx scripts/test-assistant.ts --question "..." --base-url http://localhost:3000`.

## Architecture (big picture)
- Framework: Next.js 16 app router with React 19, Tailwind v4 (design tokens in `src/app/globals.css`), Framer Motion, next-intl (request-scoped; currently `en` only).
- Routing: primary site lives in `src/app/(site)` (home, shotguns, heritage, experience, bespoke, service, concierge, engravings, journal, etc.); admin PGPT insights under `src/app/admin`; Sanity Studio mounted at `/next-studio`; API routes in `src/app/api` (assistant, build-info configurator data, serial lookup).
- Domain logic in `src/lib`: RAG retrieval (`perazzi-retrieval.ts`, `perazzi-retrieval-policy.ts`), archetype classification/weights (`perazzi-archetypes.*`, `src/config/archetype-weights.ts`), model selection (`perazziAiConfig.ts`, `perazzi-models-registry-policy.ts`), guardrails/post-validate (`perazzi-guardrail-responses.ts`, `perazzi-postvalidate.ts`), analytics/logging, build/dealer helpers.
- Content layer: Sanity schemas/queries in `src/sanity/**`; fixtures in `src/content/**` backfill page data if CMS is unreachable. Image helpers `src/lib/sanityImage.ts`; remote image hosts set in `next.config.ts`.
- Components/design system: `src/components/**` (Radix-based dialogs/tooltips, theming in `components/theme/ThemeProvider`), shared utilities in `src/utils`, `src/hooks`, and `src/types`.
- Testing: Vitest suites under `tests/{api,components,lib,pgpt-insights}` with mocks in `tests/mocks`.

## RAG/assistant flow
- Corpus defined in `PGPT/V2/AI-Docs` with manifest `Source-Corpus.md`; ingestion code lives in `scripts/ingest-v2/` and `scripts/ingest-v2.ts` (chunking, embeddings, transactionally writing to Postgres/pgvector; flags `--audit|--dry-run|--full`; env `DATABASE_URL`, `OPENAI_API_KEY` or AI Gateway, `PERAZZI_EMBED_MODEL`, `EMBED_BATCH_SIZE`).
- Retrieval engine `src/lib/perazzi-retrieval.ts` + rerank toggles (`PERAZZI_ENABLE_RERANK`, tiered boosts). Archetype boosts configured via `src/config/archetype-weights.ts` and `perazzi-archetypes.*`.
- API `src/app/api/perazzi-assistant/route.ts` orchestrates rate limits, guardrails (`perazzi-guardrail-responses.ts`), model resolution, retrieval, post-validation (`perazzi-postvalidate.ts`), and logging (`perazzi-aiLogging.ts`) gated by `PERAZZI_AI_LOGGING_ENABLED`/`PGPT_INSIGHTS_*`. Build configurator data served by `src/app/api/build-info/route.ts`; serial-year lookup by `src/app/api/serial-lookup/route.ts`.
- Admin analytics UI for PGPT Insights at `src/app/admin/pgpt-insights/*` (requires DB views `vw_archetype_daily`, `vw_trigger_terms_weekly`, etc.).

## Sanity & content
- Schemas in `src/sanity/schemaTypes`; GROQ queries under `src/sanity/queries`; shared client/env helpers in `src/sanity/env.ts`, `src/sanity/lib`.
- Fallback storytelling data in `src/content/**` for home/shotguns/heritage/experience/service/journal/bespoke; page data loaders in `src/lib/*-data.ts` merge Sanity + fixtures.
- Images: Cloudinary/Sanity/perazzi.it allowed; preconnects defined in `src/app/(site)/head.tsx`.

## Operational notes
- Use pnpm for dependency changes to avoid lock drift.
- Tailwind v4 (no config file); prefer CSS variables in `globals.css` for tokens.
- When modifying assistant/RAG logic, keep related env defaults in sync with `.env.example`.
- If Codacy MCP tools are available, run `codacy_cli_analyze` for each edited file (rootPath = repo); if tools are missing/unreachable, prompt the user to reset the MCP or enable it in Copilot settings per Codacy instructions.
