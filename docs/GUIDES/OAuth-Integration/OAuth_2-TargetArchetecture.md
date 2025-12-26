# Target Architecture

## Diagram (ASCII)

```
[Browser]
   |  (Supabase Auth cookies)
   v
[Next.js App Router]
   |-- Public pages (Sanity content)
   |-- Auth-required pages (Owner portal)
   |-- /api/perazzi-assistant
   |-- /api/commerce/* (SSO, webhooks)
   |-- /api/pos/* (admin/internal)
   |
   |--> Supabase Auth (sessions, JWT)
   |--> Supabase Postgres (RLS, pgvector)
   |--> Supabase Storage (attachments, service docs)
   |--> OpenAI (Responses + Embeddings)
   |--> Sanity (CMS)

[Background Jobs]
   |-- POS sync (scheduled / webhook)
   |-- BigCommerce sync (webhooks + backfill)
   |-- Audit log writer
```

## Stack decisions
- Keep Next.js App Router and Sanity (current stack).
- Adopt Supabase Auth + Postgres with RLS for user data and assistant history.
- Use pgvector in Supabase for public + private embeddings.
- Add background jobs (Supabase Edge Functions + cron or a lightweight worker in Next) for POS and BigCommerce sync.
- Use Supabase Storage for service attachments and supporting documents.

## Data flows

### Auth -> session -> RLS-safe access
1. User signs in via Supabase Auth (email magic link or OAuth).
2. Next middleware reads session cookie and refreshes tokens.
3. Server routes use `createServerClient` to access Postgres with RLS enforced.
4. Admin-only routes also check `profiles.role` and audit all privileged writes.

### Assistant request -> retrieval -> response -> logging
1. Client sends message to `/api/perazzi-assistant` with session cookie.
2. Route resolves user id and conversation id.
3. Retrieval combines public corpus + user-private embeddings scoped to `auth.uid()`.
4. Response is generated via OpenAI Responses API.
5. Assistant messages are stored in `assistant_messages` and summarized to `assistant_conversations`.
6. Metadata for observability is logged to `perazzi_conversation_logs` (admin-only access).

### POS sync -> service_events
1. Scheduled job or webhook ingests POS updates.
2. Service role upserts to `service_events` keyed by `(source_system, source_record_id)`.
3. Service records map to assets (`perazzi_assets`) and owners (`profiles`).
4. Owner portal reads `service_events` through RLS.

### BigCommerce sync / SSO
1. Commerce sync runs via webhooks + periodic reconciliation.
2. `commerce_customers` links BigCommerce customer id to Supabase user id.
3. Orders and order items are mirrored into Postgres for owner portal display.
4. Optional: SSO token minted by `/api/commerce/sso` for logged-in users.

## Security model

### RLS policy outline (intent)
- `profiles`: users read/update only their row; admins read all.
- `perazzi_assets`: user can select rows where `owner_user_id = auth.uid()`; admin/service role can upsert.
- `service_events`: user can select rows tied to owned assets; only admin/service role can insert/update.
- `assistant_conversations` / `assistant_messages`: user owns their rows; admin support can read with audit logging.
- `commerce_*`: user can select linked customer and orders; sync writes via service role only.
- `audit_log`: admin/service role insert; admin-only select.
- `documents/chunks/embeddings`: public rows readable by all; private rows readable only by `owner_user_id`.

### Service-role usage rules
- Service key is server-only (never in client bundles).
- Use service role only for:
  - POS sync jobs
  - BigCommerce webhooks/backfills
  - Admin actions that must bypass RLS
- Every service-role write also writes to `audit_log`.

### PII boundaries and logging
- Separate PII (profiles, commerce, service records) from assistant logs.
- Avoid logging full prompts/responses in production unless explicitly consented.
- Use redaction for email, serial numbers, and addresses in analytics logs.
