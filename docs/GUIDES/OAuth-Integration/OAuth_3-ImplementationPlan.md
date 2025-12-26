# Implementation Plan

## Phase 0 - Repo prep + env map + dependency check

**Tasks**
- Create `/docs/roadmap/` (this deliverable) and document new env vars in `.env.example`.
- Add Supabase client helpers:
  - `src/lib/supabase/server.ts` (server client)
  - `src/lib/supabase/client.ts` (browser client)
- Add `middleware.ts` for session refresh and route gating.
- Add dependencies for Supabase Auth helpers (e.g., `@supabase/ssr`, `@supabase/supabase-js`).

**Files**
- `.env.example`
- `package.json`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `middleware.ts`

**Acceptance criteria**
- Supabase URL/keys documented in `.env.example`.
- Server/client Supabase clients compile in Next App Router.

**Test strategy**
- `pnpm typecheck` verifies new helpers compile.
- Basic runtime check: `/api/health` or console log of auth session (non-production).

---

## Phase 1 - Supabase Auth integration (session + roles + protected routes)

**Tasks**
- Configure Supabase Auth (email magic link or OAuth) and add `profiles` table with roles.
- Implement auth routes/pages (sign-in, account) under `src/app/(account)`.
- Add route protection for owner portal and admin routes.
- Implement role gating (e.g., `owner`, `support`, `admin`).

**Files**
- `src/app/(account)/login/page.tsx`
- `src/app/(account)/callback/route.ts` (auth callback)
- `src/app/(owner)/layout.tsx` (protected layout)
- `src/lib/auth/requireUser.ts` (server helper)
- `src/lib/auth/requireRole.ts` (server helper)
- `supabase/migrations/*` (profiles table + RLS)

**Acceptance criteria**
- Users can sign in and obtain a session cookie.
- Protected routes redirect unauthenticated users.
- Role-gated pages are inaccessible without the required role.

**Test strategy**
- Unit tests for `requireUser` and `requireRole`.
- Manual: sign in/out flow and protected route redirects.

---

## Phase 2 - Assistant logging tables + write path + admin viewer

**Tasks**
- Add `assistant_conversations` and `assistant_messages` tables with RLS.
- Update `/api/perazzi-assistant` to create/read conversation and message rows per user.
- Add a simple admin viewer for conversation history (read-only).

**Files**
- `src/app/api/perazzi-assistant/route.ts`
- `src/lib/assistant/history.ts` (DB helpers)
- `src/app/admin/assistant-history/page.tsx`
- `supabase/migrations/*`

**Acceptance criteria**
- Each authenticated assistant interaction writes to `assistant_messages`.
- User can list their own conversation history.
- Admin viewer only accessible by `support`/`admin` roles.

**Test strategy**
- Integration test for assistant route persistence.
- RLS tests ensuring users cannot access other users' conversations.

---

## Phase 3 - Retrieval scoping (public + user-private) + tests

**Tasks**
- Add `owner_user_id` and enforce `visibility` on `documents/chunks/embeddings`.
- Update retrieval queries to include user-private rows only for the authenticated user.
- Add user-private ingestion entry point.

**Files**
- `src/lib/perazzi-retrieval.ts`
- `scripts/ingest-v2/*` (optional private ingestion path)
- `supabase/migrations/*`
- `tests/lib/retrieval.*`

**Acceptance criteria**
- Public users see only public corpus.
- Authenticated users see public + their private data.
- RLS prevents cross-user access to private embeddings.

**Test strategy**
- Unit tests for retrieval query shaping.
- RLS tests with two users and private data.

---

## Phase 4 - POS sync scaffolding (service history)

**Tasks**
- Create `perazzi_assets` and `service_events` tables with RLS.
- Define owner verification workflow (serial claim + admin review).
- Implement sync job with idempotency on `(source_system, source_record_id)`.

**Files**
- `src/lib/pos/client.ts` (POS API)
- `src/jobs/pos-sync.ts` (or `src/app/api/pos/sync/route.ts`)
- `src/app/(owner)/service-history/page.tsx`
- `supabase/migrations/*`

**Acceptance criteria**
- Service events are imported and linked to assets.
- Owners can view only their service history.
- Admins can reconcile asset ownership.

**Test strategy**
- Sync job tests for idempotency.
- RLS tests for asset and service event visibility.

---

## Phase 5 - BigCommerce headless integration

**Tasks**
- Create commerce tables (`commerce_customers`, `commerce_orders`, `commerce_order_items`).
- Add BigCommerce API client and webhook handlers.
- Implement customer linking and optional SSO token minting route.

**Files**
- `src/lib/bigcommerce/client.ts`
- `src/app/api/commerce/webhooks/route.ts`
- `src/app/api/commerce/sso/route.ts`
- `src/app/(owner)/orders/page.tsx`
- `supabase/migrations/*`

**Acceptance criteria**
- BigCommerce customer linked to Supabase user.
- Orders mirror into Postgres and are visible to owner.
- SSO token route only accessible by authenticated users.

**Test strategy**
- Webhook signature verification tests.
- RLS tests on commerce tables.
