# Phase 2 — Infrastructure & Deployment Details

This plan defines where the vector database and ingestion tooling live, how secrets/configuration are managed, and how the Next.js app will access the Concierge data during development and production.

## 1. Environments
| Environment | Purpose | Vector DB | Embeddings | Notes |
| --- | --- | --- | --- | --- |
| `local` | Developer laptops, CI dry runs | Dockerized Postgres 15 + pgvector | OpenAI (`text-embedding-3-small`) via `.env.local` key | No external dependencies beyond Docker and OpenAI key. |
| `preview` | Vercel preview deployments / staging | Managed Postgres (Supabase or Neon staging DB) | OpenAI (preview key) | Same schema as prod; seeded via manual `pnpm ingest` during QA. |
| `production` | Vercel prod + live Concierge API | Managed Postgres (Supabase/Neon prod) | OpenAI prod key | Auto-ingestion triggered via CI or Ops script on content changes. |

## 2. Postgres / pgvector Setup
- **Local:**
  - Add `docker-compose.vector.yml` that starts `postgres:15-alpine` with `PGDATA=./.data/postgres` and runs `CREATE EXTENSION vector;` on init.
  - Expose port `5433` to avoid conflicts with existing Postgres installs.
  - Provide helper script `scripts/dev-vector-db.sh` to `docker compose -f docker-compose.vector.yml up -d`.
- **Managed (Preview/Prod):**
  - Use Supabase or Neon project with `pgvector` enabled.
  - Configure connection pooling (`pgbouncer` or Neon endpoints) because Vercel serverless functions need short-lived connections.
  - Store credentials in Vercel project secrets (`vercel env add DATABASE_URL ...`).
  - Enforce SSL/TLS (`PGSSL_MODE=require`).

## 3. Environment Variables & Secrets
| Variable | Description | Local Source | Vercel Storage |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Embedding API key | `.env.local`, 1Password | Vercel Secret (`OPENAI_API_KEY`) |
| `PERAZZI_EMBED_MODEL` | Embedding model name | `.env.local` default `text-embedding-3-small` | Vercel env var |
| `EMBED_BATCH_SIZE` | Batch size for embedding calls | `.env.local` default `64` | Vercel env var |
| `DATABASE_URL` | Postgres connection string | `.env.local` uses docker compose credentials (`postgres://perazzi:perazzi@localhost:5433/perazzi`) | Vercel Secret |
| `PGVECTOR_TABLE` | Table name (default `perazzi_chunks`) | `.env.local` | Vercel env var |
| `PGVECTOR_DIM` | Vector dimension (`1536`) | `.env.local` | Vercel env var |
| `PGSSL_MODE` | `require` for managed DBs | `.env.local` default `disable` | Vercel env var |
| `SANITY_TOKEN` (future) | Read token for fetching CMS content | `.env.local` (if needed) | Vercel Secret |

Keep `.env.local` out of git via `.gitignore`. Provide `.env.example` documenting required keys and defaults.

## 4. Scripts & Commands
- `pnpm ingest:chunks` — runs chunker/embedding pipeline locally; accepts CLI flags described in Chunking Guidelines.
- `pnpm ingest:preview` — same but targets preview DB (loads `.env.preview`).
- `pnpm lint:chunks` — runs chunk linting (`--lint --strict`).
- `scripts/dev-vector-db.sh` — convenience script for Dockerized Postgres.
- `scripts/run-ingestion.ts` — TypeScript entry point reading config + metadata schema and writing to Postgres.

Document these in `README.md` under a “Knowledge Base Ingestion” section so other engineers can reproduce the process.

## 5. CI / Automation
- **GitHub Actions (or equivalent):**
  - Workflow `ci-ingest.yml` triggered manually or on demand to run `pnpm ingest:chunks --dry-run --lint` ensuring chunking rules pass.
  - Optionally schedule a weekly run to surface drift in chunk counts (no DB writes, just reports).
- **Production ingestion:**
  - For now, run manually via `pnpm ingest:chunks` whenever new content lands in `PerazziGPT` or relevant Markdown directories.
  - Later, hook Sanity webhooks to trigger ingestion via Vercel function or GitHub Action.

## 6. Access & Permissions
- Restrict managed Postgres to specific IPs / Vercel ranges; use database roles (`perazzi_ingest`, `perazzi_api`) with least privilege.
- Embedding API key stored in secret manager; do not commit to repo.
- If pricing-sensitive chunks are stored, ensure Postgres backups are encrypted (Supabase/Neon handle this by default).

## 7. Local Development Workflow
1. `pnpm install`
2. `cp .env.example .env.local` and fill secrets.
3. `./scripts/dev-vector-db.sh up`
4. `pnpm ingest:chunks --dry-run` to confirm chunking.
5. `pnpm ingest:chunks` to populate the local pgvector table.
6. `pnpm dev` to run Next.js; API routes can now query Postgres for retrieval tests.
7. `./scripts/dev-vector-db.sh down` when finished.

## 8. Monitoring & Backups
- Enable automated backups on managed Postgres (daily snapshots retained 7–30 days).
- Log ingestion stats (chunk count, tokens, runtime) to stdout; aggregate later via Datadog/Grafana once Phase 3 logging is in place.
- Consider storing ingestion run metadata in a `perazzi_ingestion_runs` table for future observability.

This infrastructure plan keeps Phase 2 focused: Dockerized Postgres locally, managed Postgres + OpenAI in the cloud, secrets centralized via `.env` and Vercel, and scripted workflows for ingestion. Adjust as we wire up Sanity automation or need HA/DR features in later phases.
