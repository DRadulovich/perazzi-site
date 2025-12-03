# PerazziGPT v2 – Infrastructure & Deployment

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_infrastructure.md`  
> Related docs:  
> - `V2_REDO_source-corpus.md`  
> - `V2_REDO_metadata-schema.md`  
> - `V2_REDO_chunking-guidelines.md`  
> - `V2_REDO_embedding-stack.md` (placeholder)  
> - `V2_REDO_rerun-process.md` (placeholder)  
> - `V2_REDO_validation.md` (placeholder)  

This document defines how PerazziGPT v2 uses **Supabase** + **pgvector** to store and query the knowledge base, and how the Next.js app and ingestion pipeline should connect across environments.

The v1 infrastructure doc (Dockerized Postgres, local `docker-compose.vector.yml`, etc.) remains available in the legacy `PerazziGPT` folder for reference, but **v2 treats Supabase as the canonical vector database**.

---

## 1. Environments Overview

PerazziGPT v2 assumes three logical environments:

| Environment | Purpose | Vector DB | Embeddings | Notes |
|------------|---------|-----------|------------|-------|
| `local`    | Developer machines | Supabase *dev* project (or local Supabase) | OpenAI embeddings (model defined by `PERAZZI_EMBED_MODEL`) | Uses `.env.local` to point to dev DB and API keys. |
| `preview`  | Vercel preview deployments / staging | Same schema as prod on a Supabase *dev/stage* DB | Same embedding model as prod | Seeded via manual ingestion runs for QA. |
| `production` | Vercel prod + live PerazziGPT API | Supabase *prod* project | Same embedding model as preview | Ingestion triggered via manual scripts or CI when corpus changes. |

**Key points:**

- All environments share the same **logical schema**: `documents`, `chunks`, `embeddings` as defined in `V2_REDO_metadata-schema.md`.
- Local dev can either:
  - Use the *dev* Supabase project directly (with a separate schema or database), or
  - Use Supabase’s local dev tools, if you prefer.
- V1’s Dockerized Postgres approach is considered legacy; v2 infra does not depend on Docker for the vector DB.

---

## 2. Supabase & pgvector Setup

### 2.1 Supabase Projects

Minimum recommended setup:

- **Supabase Dev Project**
  - Used by `local` and `preview` environments.
  - Contains:
    - `documents` table
    - `chunks` table
    - `embeddings` table
  - Uses a Supabase **service role key** for server-side ingestion and queries.

- **Supabase Prod Project**
  - Used only by `production`.
  - Mirrors dev schema exactly.
  - Has its own service role key and connection string; no cross-environment sharing.

### 2.2 pgvector Extension

For each Supabase project:

- Enable `pgvector` in the database:
  - This can usually be done via Supabase SQL:

    ```sql
    create extension if not exists vector;
    ```

- The `embeddings` table (or `chunks.embedding` if you choose that route) must use the `vector` type as specified in `V2_REDO_metadata-schema.md`.

### 2.3 Tables & Schema Alignment

The tables must match the conceptual schema:

- `documents`
- `chunks`
- `embeddings` (optional separate table; embeddings could also live on `chunks`)

As defined in `V2_REDO_metadata-schema.md`:

- `documents` tracks logical docs (path, category, doc_type, status, embed_mode, pricing_sensitive, series_* fields, etc.).
- `chunks` tracks text chunks linked to documents (heading_path, section_labels, primary_modes, archetype_bias, guardrail_flags, etc.).
- `embeddings` stores vector embeddings, keyed by `chunk_id` and `embedding_model`.

The exact DDL (CREATE TABLE statements) should be derived from the metadata schema doc. Any changes to `V2_REDO_metadata-schema.md` must be reflected as migrations in Supabase.

---

## 3. Environment Variables & Secrets

PerazziGPT v2 continues to use the existing `.env.local` variables from v1 where possible.

**Core variables (local & Vercel):**

| Variable              | Description                                           | Local Source         | Vercel Storage                   |
|-----------------------|-------------------------------------------------------|----------------------|----------------------------------|
| `OPENAI_API_KEY`      | Embedding API key                                     | `.env.local`, 1Password | Vercel Secret (`OPENAI_API_KEY`) |
| `PERAZZI_EMBED_MODEL` | Embedding model name (e.g., `text-embedding-3-large`) | `.env.local`         | Vercel env var                   |
| `EMBED_BATCH_SIZE`    | Batch size for embedding calls                        | `.env.local` (e.g., `64`) | Vercel env var               |
| `DATABASE_URL`        | Supabase Postgres connection string                   | `.env.local`         | Vercel Secret                    |
| `PGSSL_MODE`          | SSL mode (`require` for Supabase)                     | `.env.local`         | Vercel env var                   |
| `SANITY_TOKEN` (future) | Token for reading CMS content (if needed)          | `.env.local`         | Vercel Secret                    |

**Optional v2-specific variables (if you choose to use them):**

| Variable                    | Description                                   |
|----------------------------|-----------------------------------------------|
| `PERAZZI_DOCUMENTS_TABLE`  | Name of the documents table (default `documents`) |
| `PERAZZI_CHUNKS_TABLE`     | Name of the chunks table (default `chunks`)   |
| `PERAZZI_EMBEDDINGS_TABLE` | Name of the embeddings table (default `embeddings`) |

You *can* continue to use `PGVECTOR_TABLE` from v1 as an alias for the chunks table if existing code expects it. For v2, the preferred pattern is to use the explicit per-table names above (or hard-code the names in the ingestion/runtime code).

**Guidelines:**

- Keep `.env.local` out of git; maintain `.env.example` to document required variables.
- Use separate `DATABASE_URL` values for dev/preview/prod.
- Ensure `PGSSL_MODE=require` for Supabase environments.

---

## 4. Connection Patterns

### 4.1 Ingestion Pipeline

The ingestion script (Phase 5) will:

- Use Node/TypeScript to:
  - Read `V2_REDO_source-corpus.md` to determine which docs to ingest.
  - Read and chunk each doc per `V2_REDO_chunking-guidelines.md`.
  - Write `documents` and `chunks` rows to Supabase.
  - Generate embeddings via `OPENAI_API_KEY` and write them to `embeddings`.

**Connection guidance:**

- Use the **Supabase service role key** (server-side only) or a direct `DATABASE_URL` if connecting via a standard Postgres client.
- Ingest from a trusted environment (local/CI), not from the browser.
- Ensure ingestion scripts use `PGSSL_MODE=require` and do not log sensitive connection strings.

### 4.2 Next.js Runtime (API Routes / Route Handlers)

- For retrieval, Next.js (running on Vercel) should:
  - Use the **Supabase client** or a Postgres client configured with `DATABASE_URL`.
  - Only use **read-only** queries in runtime API routes:
    - `SELECT` from `chunks` + `embeddings` for nearest-neighbor search.
    - `JOIN` to `documents` for metadata.
  - Avoid mutating the DB at request time (no writes from user traffic).

- All vector similarity search should happen server-side, never in the browser.

---

## 5. Indexing & Performance

### 5.1 Vector Index on Embeddings

On the `embeddings` table (or `chunks.embedding` if you embed inline), create a pgvector index to accelerate similarity search.

Example (if embeddings live on `embeddings`):

We use an HNSW index on a half-precision view of the embedding:

```sql
create index if not exists idx_embeddings_hnsw_cosine
  on public.embeddings
  using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)
  with (m = 16, ef_construction = 200);
```
> Adjust lists based on dataset size (higher for more chunks; start conservative).

> If embeddings live on chunks.embedding, adjust table/column names accordingly.

### 5.2 Supporting Indexes

Suggested indexes:

- On `documents`:
  - `path` (BTREE)
  - `category`, `doc_type`, `status` (BTREE, possibly composite)
- On `chunks`:
  - `document_id` (BTREE)
  - `heading_path` (BTREE or GIN if needed)
  - Optional GIN index on `section_labels` or `context_tags` (JSONB) for advanced filters.

These indexes make it easy to:

- Filter by `category` or `doc_type`.
- Resolve document metadata for retrieved chunks.
- Run audits and consistency checks.

---

## 6. Roles, Keys & Security

**Supabase roles / keys:**

- **Service role key**
  - Full access; only used:
    - By ingestion scripts (Phase 5).
    - In controlled server-side environments (e.g., Vercel serverless functions).
  - NEVER exposed to the client/browser.

- **Anon key**
  - If you choose to expose any Supabase functionality to the browser, use this.
  - For PerazziGPT’s vector DB, the default stance should be: **no direct browser access**.

**Least privilege pattern:**

- If using raw Postgres connection strings:
  - Create:
    - `perazzi_ingest` role → can `INSERT`/`UPDATE` on `documents`, `chunks`, `embeddings`.
    - `perazzi_read` role → can `SELECT` from these tables, but no writes.
  - Use `perazzi_ingest` only in ingestion, and `perazzi_read` in runtime retrieval.

**Guardrails & data sensitivity:**

- Pricing-sensitive chunks (as defined by `V2_REDO_source-corpus.md` and `guardrail_flags`) exist in the DB but:
  - Must **not** leak numeric values to the model input.
  - Are still part of database backups; rely on Supabase’s built-in encrypted storage.
- Do not log entire chunks or embeddings in application logs; log IDs and metadata instead.

---

## 7. Local Development Workflow (Supabase-centric)

For v2 local dev, the canonical flow is:

1. **Set up `.env.local`**
   - Copy `.env.example` → `.env.local`.
   - Fill in:
     - `OPENAI_API_KEY`
     - Dev `DATABASE_URL` pointing to Supabase dev project.
     - `PERAZZI_EMBED_MODEL`, `EMBED_BATCH_SIZE`, `PGSSL_MODE`, etc.

2. **Run ingestion (dev DB)**
   - Once the v2 ingestion script exists (Phase 5), run:
     - `pnpm ingest:v2 --dry-run` (lint & preview).
     - `pnpm ingest:v2` (write to dev Supabase).

3. **Run Next.js dev server**
   - `pnpm dev`
   - API routes will connect to the same Supabase dev DB via `DATABASE_URL`.

4. **Reset or re-ingest as needed**
   - Use `V2_REDO_rerun-process.md` (once written) to handle updates.

Local Docker Postgres from v1 remains an optional fallback but is not the default v2 path.

---

## 8. Monitoring & Backups

- **Backups**
  - Enable automatic backups on both Supabase projects (dev and prod).
  - Retention: at least 7–30 days for prod; dev can be shorter.

- **Ingestion logs**
  - Ingestion script should log:
    - Number of documents and chunks processed.
    - Tokens embedded.
    - Time taken.
    - Any warnings (e.g., documents skipped due to errors).
  - In the future, logs can be aggregated into an `ingestion_runs` table or external service (Datadog, etc.).

- **Runtime monitoring**
  - Basic metrics:
    - RAG query counts.
    - Average latency for vector search.
    - Error counts (DB connection failures, etc.).
  - These can be wired up later in Phase 5/Phase 3; for now, note their importance here.

---

## 9. Relationship to v1 Infrastructure

The v1 infrastructure document (`PerazziGPT/Phase_2_Documents/Infrastructure.md`) defined:

- Dockerized local Postgres + pgvector.
- A similar env var and script structure.

For PerazziGPT v2:

- Supabase replaces Docker Postgres as the primary vector DB.
- Env vars and conceptual workflows (ingest → test → run dev server) remain similar.
- v1 infra can still be referenced for:
  - CI script patterns.
  - Ingestion command structure.
  - Local Postgres troubleshooting if you ever need an offline fallback.

This v2 document is the **authoritative reference** for current and future infrastructure work.