# Repo Assessment - Perazzi Owner Accounts + Assistant History + Service Records + BigCommerce

## Current state inventory (verified)

### Auth / session
- No user authentication framework or identity provider in the repo. `package.json` has no auth dependencies (no `@supabase/*`, `next-auth`, etc.).
- Client uses a local-only session id in `src/lib/session.ts` and stores chat state in localStorage via `src/components/chat/useChatState.ts`.
- Admin gating is header-token + environment checks only: `src/lib/withAdminAuth.ts`, `src/lib/requireAdmin.ts`.

### Supabase / Postgres tables and migrations
- Supabase MCP `list_tables` shows these public tables (RLS disabled for all):
  - `documents`, `chunks`, `embeddings` (RAG corpus)
  - `perazzi_conversation_logs` (assistant logs)
  - `qa_flags` (QA triage for PGPT Insights)
  - `perazzi_chunks` (legacy/alternate corpus table)
  - `archetype_margin_alert_log` (alerts)
- No `supabase/migrations` directory in the repo; SQL artifacts live in `sql/` (archetype views/alerts, audit scripts).
- Postgres access is direct via `pg` (not Supabase client): `src/lib/db.ts`, `src/lib/perazzi-retrieval.ts`, `src/lib/aiLogging.ts`, `src/lib/pgpt-insights/*`.
- Local vector DB uses `docker-compose.vector.yml` + `scripts/dev-vector-db.sh`.

### Assistant endpoints and logging
- Core assistant route: `src/app/api/perazzi-assistant/route.ts`
  - Uses OpenAI Responses API via `src/lib/aiClient.ts`.
  - Retrieval via `src/lib/perazzi-retrieval.ts`.
  - Optional file logging to `tmp/logs/perazzi-conversations.ndjson` (env `PERAZZI_ENABLE_FILE_LOG`).
  - Structured logging into `perazzi_conversation_logs` via `src/lib/aiLogging.ts` when `PERAZZI_AI_LOGGING_ENABLED=true`.
- Secondary AI route: `src/app/api/soul-journey-step/route.ts` logs to `perazzi_conversation_logs`.
- UI surfaces: `src/components/chat/*`, `src/hooks/usePerazziAssistant.ts`, `src/app/(site)/fschat/page.tsx`.

### Retrieval pipeline
- Embeddings created via OpenAI (`src/lib/aiClient.ts` -> `createEmbeddings`).
- Vector search in `src/lib/perazzi-retrieval.ts` against `documents/chunks/embeddings` using `pgvector`.
- SQL filters only allow public content (`visibility = 'public'`, `confidentiality = 'normal'`), no user-private scope.
- Ingestion scripts: `scripts/ingest-v2.ts`, `scripts/ingest-v2/db.ts`.

### Sanity usage
- Sanity client config: `src/sanity/lib/client.ts`, env in `src/sanity/env.ts`.
- Schemas live in `sanity/schemas/*` and queries in `src/sanity/queries/*`.
- Site pages consume Sanity for home, heritage, journal, service, bespoke, etc. (`src/app/(site)/*`).

### Routing structure
- Next.js App Router.
  - Public site pages under `src/app/(site)`.
  - Admin UX under `src/app/admin` (PGPT Insights, QA, templates, triggers).
  - API routes under `src/app/api` (assistant, soul-journey, serial-lookup, admin insights endpoints).
- No protected user routes; admin access is environment + header token only.

## Gap analysis vs end-state requirements

1. User accounts (auth) with sessions and role gating
- Gap: No auth provider, no session cookies, no user roles. Admin gating is header token only.
- Required: Supabase Auth (or equivalent) integration, role model, protected routes, and middleware for session refresh.

2. Durable assistant conversation history per user
- Gap: Only optional logging to `perazzi_conversation_logs` with `session_id` from localStorage; `user_id` is always null.
- Required: `assistant_conversations` / `assistant_messages` tables keyed by authenticated user id, plus UI and API wiring.

3. Retrieval with public + user-private data (RLS + query filters)
- Gap: Retrieval only touches public corpus with hardcoded public visibility filters; no user-private tables or RLS.
- Required: Extend schema to include user-private embeddings and enforce access via RLS and query scoping per auth user.

4. Service history sync (POS -> Supabase, linked to users/assets)
- Gap: No service history tables or sync job. Service content is informational only (`src/lib/service-data.ts`).
- Required: Tables for assets and service events; ingestion/sync pipeline; ownership verification workflow.

5. BigCommerce headless integration
- Gap: No BigCommerce client, webhook handlers, or customer/order tables.
- Required: Commerce data model, API integration, customer linking, optional SSO token minting.

6. Audit logging
- Gap: No audit log for sensitive writes/admin actions.
- Required: `audit_log` table + write hooks in admin/service-role flows.

## Risks & unknowns
- POS integration unknowns: API availability, data schema, delta sync mechanism, attachment handling, authentication method.
- BigCommerce assumptions: storefront API scopes, webhooks, and whether SSO is required vs optional.
- Identity verification: How users prove asset ownership (serial number verification flow, dealer/manual review).
- Privacy boundaries: retention policies for assistant logs, PII handling, and user consent for storing chat history.
- RLS hardening: moving from direct `pg` queries to RLS-safe queries without breaking current retrieval performance.
