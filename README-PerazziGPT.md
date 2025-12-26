# PerazziGPT (Developer Guide)

This document is the developer-facing overview for the PerazziGPT system. For a non-dev guide, see `README-PerazziGPT-Guide.md`.

## System boundaries and source of truth
- The PerazziGPT v2 corpus is defined only by the manifest:
  `PGPT/V2/AI-Docs/P2/Source-Corpus.md`
- Documents not listed as `Status: active` must not be embedded.
- PerazziGPT v2 content lives under `PGPT/` and excludes legacy v1 materials.

## Repository map (PerazziGPT-specific)
- Corpus manifest: `PGPT/V2/AI-Docs/P2/Source-Corpus.md`
- Core corpus files: `PGPT/V2/**`
- Chunking guidance: `PGPT/V2/AI-Docs/P2/Chunking-Guidelines.md`
- Behavior + guardrails: `PGPT/V2/AI-Docs/P1/`
- Ingestion script: `scripts/ingest-v2.ts`
- Retrieval + scoring: `src/lib/perazzi-retrieval.ts`
- Assistant API route: `src/app/api/perazzi-assistant/route.ts`
- PGPT Insights admin UI: `src/app/admin/pgpt-insights/`
- Retrieval eval harness: `scripts/perazzi-eval/retrieval-suite.ts`

## Data model (RAG tables)
- `public.documents`: document metadata + `source_checksum`
- `public.chunks`: per-document text chunks
- `public.embeddings`: vector embeddings for each chunk

## Ingestion (PerazziGPT v2)

### What ingestion does
- Reads the corpus manifest and ingests only `Status: active` docs.
- Splits docs into chunks, generates embeddings, writes to the DB.
- Reruns are safe: unchanged docs are repaired if chunks/embeddings are missing.

### Commands
- Audit only (read-only):
  `pnpm ingest:v2 -- --audit`
- Dry run (read-only):
  `pnpm ingest:v2:dry-run`
- Full run (writes + embeddings):
  `pnpm ingest:v2:full`

### Flags and environment
- `--full` forces re-ingest of all docs.
- `--dry-run` previews NEW/UPDATED/REPAIR/SKIPPED with reasons.
- `--audit` prints only docs needing attention.
- `DATABASE_URL` is required; write access needed for full runs.
- Embedding controls:
  - `PERAZZI_EMBED_MODEL` (default `text-embedding-3-large`)
  - `EMBED_BATCH_SIZE`
  - `EMBED_RETRY_LIMIT`, `EMBED_RETRY_BASE_MS`, `EMBED_RETRY_MAX_MS`

### Safety guarantees
- Embeddings are generated before any delete/insert in the DB.
- Chunks + embeddings are replaced in a single transaction.
- Advisory DB lock prevents concurrent full runs.
- Re-running after failure repairs missing data.

## Retrieval runtime (assistant flow)
- API route: `src/app/api/perazzi-assistant/route.ts`
- Retrieval engine: `src/lib/perazzi-retrieval.ts`
- AI client wrapper: `src/lib/aiClient.ts`
- Key knobs (see `.env.example` for full list):
  - `PERAZZI_MODEL`, `PERAZZI_MAX_OUTPUT_TOKENS`
  - `PERAZZI_RETRIEVAL_LIMIT`, `PERAZZI_RETRIEVAL_EXCERPT_CHARS`, `PERAZZI_RETRIEVAL_TOTAL_CHARS`
  - `PERAZZI_RETRIEVAL_POLICY` (hybrid vs always)

## PGPT Insights (logging + admin UI)
- Admin UI lives under `src/app/admin/pgpt-insights/`.
- Enable logging with `PERAZZI_AI_LOGGING_ENABLED=true`.
- Text logging is controlled by `PERAZZI_LOG_TEXT_MODE` and `PERAZZI_LOG_TEXT_MAX_CHARS`.
- Prod gating uses `PGPT_INSIGHTS_ALLOW_PROD` and optional `PGPT_INSIGHTS_ADMIN_TOKEN`.
- More details in `README-admin.md`.

## Retrieval evaluation harness
Use this after chunking/metadata changes to spot regressions:

```bash
pnpm perazzi:eval:retrieval --k 12 --rerank on --candidate-limit 60 --json tmp/retrieval-report.json
```

Canonical test cases live in:
`PGPT/V2/AI-Docs/P2/Validation.md`

## Updating the corpus (developer workflow)
1) Edit or add source docs under `PGPT/V2/`.
2) Update the manifest row in `Source-Corpus.md`.
3) Run `pnpm ingest:v2 -- --audit`, then `pnpm ingest:v2:dry-run`.
4) Run `pnpm ingest:v2:full` to apply changes.
5) Optionally run the retrieval harness to validate.

## Compliance and safety
- Pricing-sensitive docs must be marked `Pricing_Sensitive: true`.
- Files marked `Embed_Mode: metadata-only` must not embed numeric pricing.
- Documents not listed in the manifest must not be ingested.

## Troubleshooting
- Missing env vars: confirm `.env.local` (see `.env.example`).
- Rate limits/timeouts: wait and re-run the same command.
- Lock error: another ingestion run is active; retry later.

