# 1. Overview
- Next.js App Router (app directory) running Next 16 (`src/app/layout.tsx` present).
- Sanity Studio mounted at `/next-studio` via `src/app/next-studio/[[...tool]]/page.tsx` using `NextStudio` with `sanity.config.ts`.
- `@sanity/presentation` and `@sanity/visual-editing` are installed (`package.json`), and `presentationTool(...)` is enabled in `sanity.config.ts`.
- No code-level usage of `@sanity/preview-url-secret` found (only appears as a transitive lockfile entry; not configured in code or dependencies).

# 2. Sanity Studio & Presentation configuration
- File: `sanity.config.ts`
  - Uses `defineConfig` with `basePath: '/next-studio'`, project/dataset/API version from `src/sanity/env.ts`.
  - Presentation plugin:
    ```ts
    presentationTool({
      previewUrl: { origin: previewOrigin },
      allowOrigins,
    })
    ```
    - `previewOrigin` is computed: production → `NEXT_PUBLIC_SITE_URL` or `https://${NEXT_PUBLIC_VERCEL_URL}` fallback; non-production → `NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN` (default `http://localhost:3000`).
    - `allowOrigins` dedupes `[previewOrigin, deployedPreview, localPreview]` for overlay connections.
  - No `previewUrl.pathname`/locations or explicit draft route references; origin-only configuration.
  - Studio theming/components wired via `perazziTheme`, `StudioLogo`, `StudioNavbar`.
  - Vision and desk tools also enabled.

# 3. Visual Editing wiring in the Next.js app
- File: `src/app/layout.tsx`
  - Renders `<SanityLive />` (from `src/sanity/lib/live`) globally inside the root layout, regardless of draft mode.
  - Conditionally renders `<VisualEditing />` only when `draftMode()` is enabled; draft state retrieved per-request via `next/headers`.
  - Wrapped by app-wide `Providers`; no other Sanity-specific providers elsewhere.
  - Effect: live content transport is always mounted, while overlays only appear for draft-mode sessions.

# 4. Live query and client setup
- File: `src/sanity/lib/client.ts`
  - `createClient` from `next-sanity` with `{ projectId, dataset, apiVersion, useCdn: false, stega: { studioUrl: '/next-studio' } }`.
  - Values from `src/sanity/env.ts` (NEXT_PUBLIC_* envs; `apiVersion` default `2025-11-07`), so client is draft-capable and stega-ready.
- File: `src/sanity/lib/live.ts`
  - `defineLive({ client, serverToken: serverToken || false, browserToken: browserToken || false, stega: true })`.
  - Exposes `{ sanityFetch, SanityLive }`. Stega metadata is included on queries using `sanityFetch`.
- File: `src/sanity/lib/tokens.ts`
  - `serverToken` reads `SANITY_API_READ_TOKEN` → `SANITY_READ_TOKEN` → `SANITY_STUDIO_TOKEN` (optional).
  - `browserToken` reads `NEXT_PUBLIC_SANITY_BROWSER_TOKEN` (optional overlay token).
- Additional legacy/published-only client:
  - File: `sanity/client.ts` uses `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_VERSION` (default `2023-10-01`), `useCdn` in production, `perspective: 'published'`. This client powers most non-journal queries and is not stega/live-enabled.

# 5. Draft-mode / preview API routes
- File: `src/app/api/draft/route.ts`
  - Uses `defineEnableDraftMode({ client: client.withConfig({ token: serverToken }) })` from `next-sanity/draft-mode`.
  - Warns at module load if no `serverToken`, meaning draft previews may fall back to public content.
  - No preview secret validation or `@sanity/preview-url-secret`; relies solely on the helper’s default behavior (enable draft mode based on the incoming request, no custom redirect logic shown).
- No other draft/preview API routes found.

# 6. Queries using `sanityFetch` / stega
- Visual-editing-enabled:
  - `src/sanity/queries/journal.ts`: `getJournalLanding`, `getArticles`, `getAuthor` use `sanityFetch` with `stega: true`.
    - Consumed by `src/lib/journal-data.ts`, which feeds journal pages (`src/app/journal/page.tsx`, `src/app/journal/[slug]/page.tsx`, category routes under `src/app/journal/*/page.tsx`).
- Non-stega/plain client usage (published-only, via `sanity/client.ts`):
  - `src/sanity/queries/home.ts` (home page data).
  - `src/sanity/queries/bespoke.ts` (bespoke/booking content).
  - `src/sanity/queries/experience.ts` (experience pages).
  - `src/sanity/queries/heritage.ts` (heritage timelines/events/champions).
  - `src/sanity/queries/service.ts` (service content).
  - `src/sanity/queries/shotguns.ts` (catalog/platforms/disciplines/grades).
  - `src/sanity/queries/manufactureYear.ts` (serial lookup metadata).
  - These calls use `sanityClient.fetch` without stega/live wiring.

# 7. Environment variables & tokens
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` — required in `src/sanity/env.ts` and `sanity.config.ts`; also used by `sanity.cli.ts`. Identify the Sanity project/dataset for Studio and live client.
- `NEXT_PUBLIC_SANITY_API_VERSION` — optional in `src/sanity/env.ts` (defaults to `2025-11-07`); controls API version for the live/stega client.
- `NEXT_PUBLIC_SITE_URL` — used in `sanity.config.ts` to build the production `previewOrigin`.
- `NEXT_PUBLIC_VERCEL_URL` — fallback for deployed preview origin in `sanity.config.ts`.
- `NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN` — optional local preview origin override (default `http://localhost:3000`) in `sanity.config.ts`.
- `SANITY_API_READ_TOKEN` → `SANITY_READ_TOKEN` → `SANITY_STUDIO_TOKEN` — server-side token chain in `src/sanity/lib/tokens.ts`; used by `defineLive` and `/api/draft` route.
- `NEXT_PUBLIC_SANITY_BROWSER_TOKEN` — optional browser token for overlays in `src/sanity/lib/tokens.ts`/`live.ts`.
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` — used by `sanity/client.ts` and several scripts; power the published-only client (default API version `2023-10-01`).

# 8. Potential gaps / TODOs (observations only)
- Only journal queries use `sanityFetch` with stega/live; all other site queries rely on the published-only client (`sanity/client.ts`), so most pages currently lack visual editing/live updates.
- `/api/draft` has no preview secret or `@sanity/preview-url-secret` integration; access control depends on default `defineEnableDraftMode` behavior.
- Presentation tool is configured with an origin-only `previewUrl` and generic `allowOrigins`; no explicit preview pathname or redirect targets are set.
- Draft overlays (`<VisualEditing />`) depend on draft mode plus tokens; missing `serverToken`/`browserToken` would disable drafts or overlays despite `SanityLive` rendering globally.
- Mixed client/env usage (`src/sanity/lib/client.ts` vs `sanity/client.ts`) means API versions, caching, and perspectives differ between journal pages (live/stega) and the rest of the site (cached/published).
