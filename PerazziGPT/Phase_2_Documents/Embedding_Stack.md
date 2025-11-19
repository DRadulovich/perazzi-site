# Phase 2 — Embedding & Vector Stack

This plan selects the default model/provider and storage layer for Phase 2 ingestion, keeping things simple to operate inside the current Next.js + Vercel environment while remaining portable to future infrastructure.

## 1. Embedding Model & Provider
- **Primary model:** `text-embedding-3-small` (OpenAI).
  - 1,536-d vectors that still offer strong multilingual coverage (useful for Phase 7) while keeping us under pgvector’s current index limits.
  - Deterministic outputs given the same text, which simplifies checksum-based caching.
- **Fallback model:** `text-embedding-3-large` — only switch if we later migrate to a vector store that supports >2,000 dims or we deliberately trade indexing for accuracy.
- **Endpoint:** `https://api.openai.com/v1/embeddings`.
- **Environment variables:**
  - `OPENAI_API_KEY` — stored in 1Password / Vercel secrets.
  - `PERAZZI_EMBED_MODEL` — defaults to `text-embedding-3-small` but allows overrides per environment.
  - `EMBED_BATCH_SIZE` — e.g., 64 chunks; tune based on latency.

## 2. Vector Store Selection
- **Store:** Postgres + `pgvector` extension.
  - **Why:**
    - Already aligns with the Next.js stack, deployable via Supabase, Neon, or self-hosted Postgres.
    - Lets us keep embeddings, metadata, and operational logs in a single RDBMS (matches roadmap guidance for auditable logs in Phase 3).
    - Easy to run locally via Docker for development.
- **Hosting plan:**
  - Development: Dockerized Postgres 15 with `pgvector` 0.5.x (`docker-compose` service).
  - Production: Managed Postgres (e.g., Supabase or Neon) with `pgvector` enabled; configure Vercel serverless functions via pooled connection string.
- **Environment variables:**
  - `DATABASE_URL` — Postgres connection string with pooling (e.g., `postgresql://user:pass@host/db`).
  - `PGVECTOR_TABLE` — default `perazzi_chunks`.
  - `PGVECTOR_DIM` — 1536 (bump only if the embedding model changes).
  - `PGSSL_MODE` — `require` for managed services.

## 3. Schema & Indexing
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS perazzi_chunks (
  chunk_id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS perazzi_chunks_doc_id_idx ON perazzi_chunks (doc_id);
CREATE INDEX IF NOT EXISTS perazzi_chunks_metadata_idx ON perazzi_chunks USING GIN (metadata);
CREATE INDEX IF NOT EXISTS perazzi_chunks_embedding_idx ON perazzi_chunks USING ivfflat (embedding vector_l2_ops);
```
- Use `vector_cosine_ops` if cosine similarity performs better during evaluation.
- `metadata` stores the full object from `Metadata_Schema.md` for each chunk.

## 4. Ingestion Workflow
1. **Chunk generation:** run the CLI with `--config PerazziGPT/Phase_2_Documents/chunking.config.json`.
2. **Checksum check:** compare `source_checksum` + `chunk_index` against existing rows; skip re-embedding identical text.
3. **Embedding call:** batch chunks (e.g., 64 at a time) using `PERAZZI_EMBED_MODEL`. Cache responses keyed by checksum.
4. **Insert/upsert:** use `INSERT ... ON CONFLICT (chunk_id) DO UPDATE` to refresh content, metadata, embedding, and `updated_at`.
5. **Verification:** run a quick similarity smoke test (sample query) and log average embedding norms; warn if any chunk falls below expected dot-product magnitude.
6. **Metrics:** record timing + token usage per ingestion run for dashboards.

## 5. Retrieval Usage (Preview)
- Query flow (Phase 3): embed user message with the same `PERAZZI_EMBED_MODEL`, filter by metadata (language, discipline, persona), then run:
```sql
SELECT content, metadata, 1 - (embedding <=> $1::vector) AS score
FROM perazzi_chunks
WHERE metadata ->> 'language' = 'en'
  AND (metadata ->> 'discipline') IN ('sporting', 'ata_trap')
ORDER BY embedding <=> $1::vector
LIMIT 6;
```
- Exclude `pricing_sensitive=true` chunks unless the guardrail explicitly allows referencing descriptive info.

## 6. Local Dev & Tooling
- Provide `scripts/dev-vector-db.sh` (or docker-compose) to spin up Postgres with `pgvector` locally.
- Add `scripts/seed-chunks.ts` to run the chunker + embeddings end-to-end.
- Include smoke tests that ensure `pgvector` dimension matches `PERAZZI_EMBED_MODEL`; fail fast if misconfigured.

## 7. Future-Proofing
- If we later require on-prem embeddings, swap `PERAZZI_EMBED_MODEL` for an OSS alternative (e.g., `nomic-embed-text` via Ollama) but keep the same table schema/dimension env var.
- For high-scale or multi-region needs, we can mirror the Postgres data into a managed vector DB (Pinecone/Qdrant) using the same metadata contract without rewriting the ingestion pipeline.

This stack keeps Phase 2 lean—one API provider, one database—while aligning with the roadmap’s emphasis on auditability, metadata-rich retrieval, and eventual logging hooks.
