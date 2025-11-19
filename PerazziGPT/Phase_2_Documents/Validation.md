# Phase 2 — Validation Requirements

This checklist defines when the knowledge base is considered "populated" and what automated checks must pass before embeddings are written to pgvector.

## 1. Definition of "Populated"
A successful ingestion run must satisfy all of the following:
1. **Document coverage**
   - Phase 1 Specs (`PerazziGPT/Phase_1_Documents/*`, `docs/assistant-spec.md`) — each file yields ≥1 chunk.
   - Brand Info (`PerazziGPT/Brand_Info/*.md`) — each file yields ≥2 chunks covering tone/ethos sections.
   - Live Site Narratives (`PerazziGPT/Live_Site_Narratives/*.md`) — combined total ≥12 chunks (hero + journey + service + heritage).
   - Company Info lists (`PerazziGPT/Company_Info/*.md`) — 100% of entries represented (dealer, service center, events, athletes).
   - Gun Info (`PerazziGPT/Gun_Info/*.md/.json`) — ≥90% of rows or objects successfully chunked.
2. **Corpus size** — at least 150 total chunks spanning ≥6 distinct `type` values and ≥2 `audience` values.
3. **Language coverage** — English chunks present; when other languages appear, they must include the correct `language` metadata (future-proofing for Phase 7).

## 2. Chunk Quality Gates
- **Lint pass:** `pnpm ingest:validate` (chunker `--dry-run --lint --strict`) must succeed; any sentence-boundary or heading-containment errors fail the run.
- **Token & word caps:** no chunk may exceed 1,200 tokens or 1,200 words unless the rule specifies `allow_overflow=true`. Violations fail the run.
- **Metadata completeness:** every chunk must include the required fields from `Metadata_Schema.md` (id, chunk_id, type, language, audience, source_checksum, chunk_index, chunk_count, token_count, embedding_model, last_updated). Missing fields fail the run.
- **Guardrail tagging:** pricing-derived chunks must set `pricing_sensitive=true` and include `guardrail_flags` noting removed columns.

## 3. Embedding Integrity
- **Norm monitoring:** log the L2 norm for each embedding. Expected range for `text-embedding-3-small` is ~0.4–1.4. If more than 2% of chunks fall outside that range, mark the run as failed; otherwise emit a warning.
- **Empty text detection:** fail if any chunk content is blank or <20 characters after normalization.
- **Model consistency:** ensure `embedding.dimension == PGVECTOR_DIM`; mismatch triggers a hard failure.

## 4. Coverage Report
- Generate `tmp/ingestion-reports/<timestamp>.json` summarizing, per document:
  - `doc_id`
  - `chunk_count`
  - `total_tokens`
  - `last_updated`
  - `guardrail_flags`
- Include delta vs. previous run (if a baseline exists). Attach this report to PRs touching source documents.

## 5. CI Enforcement
- Add `pnpm ingest:validate` to CI (manual or scheduled). The job should:
  1. run chunker `--dry-run --lint --strict`;
  2. verify schema/metadata with a JSON schema validator;
  3. compare chunk counts to `tmp/ingestion-baseline.json` (committed baseline) and fail if any doc’s chunk count changes by >20% without a source checksum change.
- PR template should include a checkbox: "[ ] `pnpm ingest:validate` run and coverage report attached".

## 6. Manual Review Triggers
- If a run fails due to coverage or embedding norms, investigate before re-running; do not ignore warnings.
- Significant corpus changes (new document types, large deletions) require sign-off from the Digital Experience lead before ingestion.

Keeping these validation requirements strict ensures the Phase 2 knowledge base is trustworthy before we wire it into the Concierge API.
