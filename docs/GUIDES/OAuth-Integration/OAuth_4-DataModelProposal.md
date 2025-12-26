# Data Model Proposal

## New tables (proposed)

### profiles
- Key columns
  - `id uuid primary key` (FK to `auth.users.id`)
  - `email text` (optional cache; avoid storing unless needed)
  - `display_name text`
  - `role text` (e.g., `owner`, `support`, `admin`)
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Indexes
  - `profiles_pkey` on `id`
  - Optional `profiles_role_idx` on `role`
- RLS intent
  - User can read/update own row
  - Admin can read/update all

### perazzi_assets
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `owner_user_id uuid not null`
  - `serial_number text not null unique`
  - `model text`
  - `platform text`
  - `verification_status text` (e.g., `unverified`, `pending`, `verified`, `rejected`)
  - `verification_method text` (e.g., `pos_match`, `dealer_review`)
  - `verified_at timestamptz`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Indexes
  - `perazzi_assets_owner_idx` on `owner_user_id`
  - `perazzi_assets_serial_unique` on `serial_number`
- RLS intent
  - Owner can read/update their assets
  - Service role/admin can insert/update for verification

### service_events
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `asset_id uuid not null`
  - `owner_user_id uuid not null`
  - `source_system text not null` (e.g., `perazzi_pos`)
  - `source_record_id text not null`
  - `service_date timestamptz`
  - `status text` (e.g., `received`, `in_service`, `completed`)
  - `work_summary text`
  - `attachments jsonb` (storage paths)
  - `raw_payload jsonb` (restricted access)
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Indexes
  - `service_events_asset_idx` on `asset_id`
  - `service_events_owner_idx` on `owner_user_id`
  - `service_events_source_unique` on `(source_system, source_record_id)`
- RLS intent
  - Owner reads only their records
  - Service role inserts/updates
  - Admin can read for support

### assistant_conversations
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null`
  - `title text`
  - `status text` (e.g., `active`, `archived`)
  - `last_message_at timestamptz`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Indexes
  - `assistant_conversations_user_idx` on `user_id`
  - `assistant_conversations_last_msg_idx` on `last_message_at`
- RLS intent
  - User can read/write own conversations
  - Admin support can read with audit logging

### assistant_messages
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `conversation_id uuid not null`
  - `user_id uuid not null`
  - `role text` (`user` | `assistant` | `system`)
  - `content text`
  - `citations jsonb`
  - `model text`
  - `response_id text`
  - `metadata jsonb`
  - `created_at timestamptz default now()`
- Indexes
  - `assistant_messages_conversation_idx` on `conversation_id`
  - `assistant_messages_user_idx` on `user_id`
- RLS intent
  - User can read/write own messages
  - Admin support can read with audit logging

### commerce_customers
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null`
  - `bigcommerce_customer_id text not null unique`
  - `email text`
  - `link_status text` (e.g., `linked`, `pending`, `unlinked`)
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Indexes
  - `commerce_customers_user_idx` on `user_id`
  - `commerce_customers_bc_unique` on `bigcommerce_customer_id`
- RLS intent
  - User can read only their linked customer
  - Service role inserts/updates via webhooks

### commerce_orders
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `commerce_customer_id uuid not null`
  - `bigcommerce_order_id text not null unique`
  - `order_number text`
  - `status text`
  - `total_amount numeric`
  - `currency text`
  - `placed_at timestamptz`
  - `raw_payload jsonb`
  - `created_at timestamptz default now()`
- Indexes
  - `commerce_orders_customer_idx` on `commerce_customer_id`
  - `commerce_orders_placed_idx` on `placed_at`
- RLS intent
  - User can read orders tied to their customer record
  - Service role inserts/updates

### commerce_order_items
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `commerce_order_id uuid not null`
  - `sku text`
  - `product_id text`
  - `name text`
  - `quantity integer`
  - `price numeric`
  - `raw_payload jsonb`
- Indexes
  - `commerce_order_items_order_idx` on `commerce_order_id`
- RLS intent
  - User can read items for their orders

### audit_log
- Key columns
  - `id uuid primary key default gen_random_uuid()`
  - `actor_user_id uuid`
  - `actor_role text`
  - `action text` (e.g., `asset.verify`, `service.update`, `admin.override`)
  - `object_type text`
  - `object_id text`
  - `ip text`
  - `user_agent text`
  - `metadata jsonb`
  - `created_at timestamptz default now()`
- Indexes
  - `audit_log_actor_idx` on `actor_user_id`
  - `audit_log_object_idx` on `(object_type, object_id)`
  - `audit_log_created_idx` on `created_at`
- RLS intent
  - Admin/service role insert
  - Admin-only select

## Existing tables (adjustments to enable private retrieval)

### documents / chunks / embeddings
- Current usage: `scripts/ingest-v2/*` and `src/lib/perazzi-retrieval.ts`.
- Proposed additions
  - Add `owner_user_id uuid null` to `documents` and `chunks` (or a separate private-corpus table).
  - Enforce `visibility` (`public` or `private`) with RLS.
- Indexes
  - `embeddings_embedding_hnsw` (or `ivfflat`) on `embeddings.embedding` with `vector_cosine_ops`.
  - `documents_owner_idx` and `chunks_owner_idx` on `owner_user_id`.
- RLS intent
  - Public rows readable by all.
  - Private rows readable only by `owner_user_id = auth.uid()`.

## RLS summary (high level)
- Default deny with explicit select/insert/update policies.
- Use `auth.uid()` scoping for user data.
- Service role bypass only for background sync and admin tools, paired with `audit_log` writes.
