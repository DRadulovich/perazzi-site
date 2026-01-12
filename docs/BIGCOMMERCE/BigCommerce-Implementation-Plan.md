# BigCommerce Phase I Implementation Plan (perazzi-site)

## Scope Summary
- **Phase I features**: `/shop` storefront with category + price min/max + in-stock + sort + search term filters, product detail pages, cart, and hosted checkout redirect.
- **Out of scope for Phase I**: promos, shipping estimates, gift certificates, customer accounts, analytics events.

## Target Route Map (Recommended)
- `/shop` (all products + filters + search)
- `/shop/category/[slug]` (category-scoped products + filters)
- `/shop/product/[slug]` (product detail)
- `/shop/cart` (cart review)
- `/shop/checkout` (server redirect to BigCommerce hosted checkout)

## Required Environment Variables (Vercel + local)
- `BIGCOMMERCE_STORE_HASH=xepzvzkxzc`
- `BIGCOMMERCE_STOREFRONT_TOKEN=...`
- `BIGCOMMERCE_CHANNEL_ID=1`
- `BIGCOMMERCE_CDN_HOSTNAME=*.bigcommerce.com` (or actual CDN host if known)
- `BIGCOMMERCE_WEBHOOK_SECRET=...` (used for webhook validation)

## Implementation Steps

### Step 1 — Foundation: BigCommerce Config + Client
**Manual steps (do these before/while running the task card)**
- Create/store the BigCommerce Storefront API token and add it to Vercel as `BIGCOMMERCE_STOREFRONT_TOKEN`.
- Confirm the store hash `xepzvzkxzc` and set `BIGCOMMERCE_STORE_HASH` in Vercel.
- Set `BIGCOMMERCE_CHANNEL_ID=1` in Vercel.
- Decide the CDN hostname value (use `*.bigcommerce.com` if unknown).

**TASK CARD 1 (Codex)**
- Add a BigCommerce client module (fetch wrapper) and env constants:
  - `src/lib/bigcommerce/constants.ts`
  - `src/lib/bigcommerce/client.ts`
- Update `next.config.ts` to allow BigCommerce CDN images using `process.env.BIGCOMMERCE_CDN_HOSTNAME`.
- Update `.env.example` with all required BigCommerce variables above.
- Keep all new utilities server-only or safe for server usage.
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

### Step 2 — Data Layer: Queries + Mappers
**Manual steps**
- None.

**TASK CARD 2 (Codex)**
- Add GraphQL queries and typed mappers for:
  - Category tree listing
  - Route → entity lookup (category/product) via `site.route(path: ...)`
  - Product search with filters (category, price, in-stock, search term, sort)
  - Product detail by entity id
  - Cart create/add/update/remove + cart fetch
  - Checkout redirect URL via `createCartRedirectUrls` mutation
- Suggested paths:
  - `src/lib/bigcommerce/queries/*.ts`
  - `src/lib/bigcommerce/mappers.ts`
  - `src/lib/bigcommerce/index.ts` (exports high-level functions)
- Ensure returned shapes are simple view models for UI components.
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

### Step 3 — Shop Route Scaffolding + UI Components
**Manual steps**
- None.

**TASK CARD 3 (Codex)**
- Create shop routes under the site group so the existing nav/footer are reused:
  - `src/app/(site)/shop/page.tsx`
  - `src/app/(site)/shop/category/[slug]/page.tsx`
  - `src/app/(site)/shop/product/[slug]/page.tsx`
- Add shop UI components under `src/components/shop/*`:
  - `ProductCard`, `ProductGrid`, `FiltersPanel`, `PriceRangeInputs`, `SortSelect`
- Use existing UI primitives from `src/components/ui/index.ts` and `SiteShell`.
- Add basic metadata (`generateMetadata`) for shop pages.
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

### Step 4 — Cart + Checkout Redirect
**Manual steps**
- None.

**TASK CARD 4 (Codex)**
- Implement cart actions + cookie storage:
  - `src/app/(site)/shop/cart/actions.ts` (server actions: add/update/remove)
  - `src/lib/bigcommerce/cart.ts` (wrapper helpers if needed)
- Add cart page:
  - `src/app/(site)/shop/cart/page.tsx`
- Add checkout redirect route:
  - `src/app/(site)/shop/checkout/route.ts`
  - Use BigCommerce `createCartRedirectUrls` and redirect the user to `redirectedCheckoutUrl`.
- Add "Add to cart" action on PDP and a cart link in the shop UI.
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

### Step 5 — Filters + Search Wiring (Basic Only)
**Manual steps**
- None.

**TASK CARD 5 (Codex)**
- Implement basic filters and query parsing (no dynamic facets):
  - Category filter list from BigCommerce category tree
  - Price min/max inputs
  - In-stock toggle
  - Sort selector
  - Search term input (only on `/shop`)
- Translate query params → BigCommerce `searchProducts(filters, sort)` input.
- Ensure category pages apply the category filter automatically.
- Decide on pagination approach:
  - If shipping in Phase I, use a simple `limit` + cursor approach.
  - Otherwise, keep initial results to a fixed page size (document it).
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

### Step 6 — SEO + Sitemap + Webhooks
**Manual steps**
- Create a BigCommerce webhook for catalog changes pointing to the new endpoint:
  - Events: product created/updated/deleted, category created/updated/deleted
  - URL: `https://<your-domain>/api/bigcommerce/webhook`
  - Secret: set `BIGCOMMERCE_WEBHOOK_SECRET` in Vercel to match the webhook secret.

**TASK CARD 6 (Codex)**
- Add sitemap generation that includes `/shop`, category pages, and product pages:
  - `src/app/sitemap.ts`
- Add a webhook handler to revalidate shop pages on catalog updates:
  - `src/app/api/bigcommerce/webhook/route.ts`
  - Validate signature using `BIGCOMMERCE_WEBHOOK_SECRET`.
  - Revalidate relevant tags/paths (e.g., `/shop`, `/shop/category/[slug]`, `/shop/product/[slug]`).
- Ensure shop pages are discoverable in metadata and sitemap day one.
- **Required checks**: run `pnpm lint` and `pnpm typecheck`, fix issues in files edited/created in this task.
- **Required output**: end the task with a non-dev summary, and if fully complete print:  
  `CODEX TASK CARD 100% IMPLEMENTED: PROCEED TO NEXT TASK CARD`

---

## Optional Quality Pass (Post-Phase I)
- Add analytics events (view item, add to cart, begin checkout).
- Add pagination enhancements (prev/next, page numbers, or cursor-based load more).
- Add customer accounts later (Auth + per-user tokens).

