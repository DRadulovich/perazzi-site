# PerazziGPT v2 – Ingestion & Rerun Process

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_rerun-process.md`  
> Related docs:  
> - `V2_REDO_source-corpus.md`  
> - `V2_REDO_metadata-schema.md`  
> - `V2_REDO_chunking-guidelines.md`  
> - `V2_REDO_embedding-stack.md`  
> - `V2_REDO_infrastructure.md`  
> - `V2_REDO_validation.md` (placeholder)  

This document describes **how** PerazziGPT v2’s corpus is ingested into Supabase and **how reruns are handled safely** when documents change.

The goals are:

- Make ingestion **repeatable and auditable**.  
- Avoid unnecessary re-embedding when nothing meaningful has changed.  
- Ensure **pricing guardrails** and safety constraints are always respected.  
- Keep the procedure simple enough that a developer can run it without talking to “past David.”

---

## 1. Terminology

- **Source corpus** – The set of files under `V2-PGPT/V2_PreBuild-Docs` that are eligible for ingestion, as defined by `V2_REDO_source-corpus.md`.
- **Document** – A logical source file (e.g., a single `.md` or `.json`), represented by one row in the `documents` table.
- **Chunk** – A semantically coherent slice of a document, represented by one row in the `chunks` table.
- **Embedding** – A vector representation of a chunk, stored in the `embeddings` table.

---

## 2. When to Run Ingestion / Reruns

Ingestion should be run in two broad scenarios:

### 2.1 Initial Ingest (cold start)

Run a **full ingest** when:

- Setting up a new environment (dev, preview, prod).  
- The Supabase database has been recreated or cleared.  
- Major schema changes have been applied that invalidate existing rows.

### 2.2 Incremental Rerun (updates)

Run an **incremental rerun** (targeted re-ingest) when:

- A source document in `V2_PreBuild-Docs` changes:
  - Content edited,
  - Renamed (path change),
  - Added/removed entirely.
- `V2_REDO_source-corpus.md` changes:
  - Docs switched between `Status: active` / `planned` / `deprecated`,
  - Categories or Doc_Types updated.
- `V2_REDO_chunking-guidelines.md` or `V2_REDO_chunking.config.json` changes:
  - Chunking behavior differs enough to change chunk boundaries.
- `V2_REDO_embedding-stack.md` changes embedding behavior materially:
  - Embedding model change (e.g., new model).
  - Significant preprocessing changes.

When in doubt, favor rerunning ingestion for the affected documents; quality is prioritized over minimal cost.

---

## 3. High-Level Ingestion Flow

The ingestion pipeline (e.g., a Node/TS script or CLI command like `pnpm ingest:v2`) should follow this high-level process:

1. **Load configuration**
   - Read:
     - `V2_REDO_source-corpus.md`
     - `V2_REDO_metadata-schema.md`
     - `V2_REDO_chunking-guidelines.md`
     - `V2_REDO_embedding-stack.md`
   - Validate that required fields and tables exist (at least `documents`, `chunks`, `embeddings`).

2. **Scan source corpus**
   - Build a list of documents with `Status: active` from `V2_REDO_source-corpus.md`.
   - For each active doc:
     - Resolve its `Path` to an actual file under `V2_PreBuild-Docs`.

3. **Per-document processing**
   - For each active document:
     1. Read file contents.
     2. Compute a **document checksum** (e.g., SHA-256 of file contents).
     3. Compare checksum against existing `documents.source_checksum` (if any).
        - If no row exists → treat as **new** document.
        - If checksum differs → treat as **modified** document.
        - If checksum is identical → skip **unless** running a forced full ingest.
     4. For new or modified docs:
        - Parse `## 0. Metadata` (if present) to derive doc-level fields.
        - Upsert into `documents` with updated `source_checksum`.

4. **Chunking**
   - For each new/modified document:
     - Apply the chunking rules from `V2_REDO_chunking-guidelines.md` (and `V2_REDO_chunking.config.json` if used).
     - Produce an ordered list of chunks with:
       - `text`
       - `chunk_index`
       - `heading`, `heading_path`, `section_labels`
       - `primary_modes`, `archetype_bias`
       - Any other metadata to populate `chunks` rows.

5. **Chunk upserts**
   - For the target document:
     - Option A (simple & safe):
       - Delete all existing `chunks` and `embeddings` rows for that `document_id`.
       - Insert new `chunks`, then new `embeddings`.
     - Option B (future optimization):
       - Diff old vs new chunks via local hashing and only re-embed changed ones.
   - v2 defaults to **Option A** for simplicity and correctness.

6. **Embeddings**
   - For each new chunk:
     - Preprocess text per `V2_REDO_embedding-stack.md`.
     - Batch chunks (e.g., 64 per call).
     - Call OpenAI’s `text-embedding-3-large`.
     - Insert into `embeddings` with:
       - `chunk_id`
       - `embedding_model` = `"text-embedding-3-large"`
       - `embedding`
       - `embedding_norm` (if computed)
       - `created_at`

7. **Finalization**
   - Log ingestion statistics:
     - Docs processed (new/updated/skipped).
     - Chunks created.
     - Tokens embedded.
     - Any errors or warnings.
   - Optionally run a small validation suite (see `V2_REDO_validation.md` once defined).

---

## 4. Document-Level vs Chunk-Level Change Detection

v2 uses **document-level checksums** as the primary mechanism.

### 4.1 Document-level checksum

- Each `documents` row has:
  - `source_checksum` – a hash of the source file contents.
- On rerun:
  - If checksum is unchanged, we assume no chunk content changed and skip re-processing that document.
  - If checksum changed, we:
    - Re-chunk the document.
    - Re-create its chunks.
    - Re-embed those chunks.

This is simple and safe, and is the v2 default.

### 4.2 Optional future optimization

In a future iteration, you may:

- Add a `chunk_checksum` column to `chunks`:
  - Hash of chunk text.
- On rerun:
  - Compare new chunk hashes to existing:
    - If unchanged → reuse existing embedding.
    - If changed or new → re-embed.

For v2, this is **not required**. The spec here should be seen as a possible future optimization.

---

## 5. Safeguards & Guardrails

The rerun process must respect all guardrails defined in:

- `V2_REDO_non-negotiable-guardrails.md`
- `V2_REDO_source-corpus.md`
- `V2_REDO_embedding-stack.md`

### 5.1 Source Corpus Status & Modes

- Only ingest documents with `Status: active`.  
- Documents marked `planned` or `deprecated`:
  - Must not be embedded.
  - If they exist in the DB from older runs, the rerun script should:
    - Either leave them alone, or
    - Optionally delete their `chunks`/`embeddings` if you want a perfectly clean state.

### 5.2 Pricing & sensitive data

- For any doc with `Pricing_Sensitive: true`:
  - Ensure that the chunker and preprocessing logic **never** include numeric pricing fields in chunk text.
  - Even on rerun, embeddings must only reflect:
    - Descriptions,
    - Codes,
    - Categories,
    - Option labels.
- Use `guardrail_flags` on both `documents` and `chunks` (e.g., `"pricing_sensitive_source"`) so runtime retrieval can treat these chunks cautiously.

### 5.3 Safety / gunsmithing content

- When ingesting docs that contain safety or service information:
  - Ensure that the content is coming from **approved** Perazzi docs (e.g., consumer warning, service center guidance).
  - If a doc is deprecated or replaced, deactivating it in `V2_REDO_source-corpus.md` should remove it from future retrieval:
    - By setting `Status: deprecated`.
    - Optionally by deleting associated `chunks` and `embeddings`.

---

## 6. Rerun Modes & CLI Interface (Conceptual)

Exact script names are up to implementation, but conceptually there should be at least:

### 6.1 Full ingest

Example:

```bash
pnpm ingest:v2 --full
```

Behavior:

- Recomputes checksums for all active documents.
- Forces re-chunk + re-embed for **every** active document, regardless of prior checksum.
- Useful for:
  - First-time ingestion in a fresh DB.
  - Global model change (e.g., switching embedding model).

### 6.2 Incremental ingest

Example:

```bash
pnpm ingest:v2
```

Behavior:

- Default rerun:
  - Reads checksums.
  - Only processes documents whose checksum has changed or that are new.
- Optionally accepts filters:
  - `--path` for a specific document.
  - `--category` or `--doc-type` to restrict scope.

### 6.3 Dry run

Example:

```bash
pnpm ingest:v2 --dry-run
```

Behavior:

- Simulates the ingestion:
  - Reports which docs *would* be processed (new/modified/skipped).
  - Does **not** write to the database.
- Useful for confirming the scope of changes before a large rerun.

---

## 7. Logging & Audit Trail

The rerun process should generate a clear audit trail. This can be as simple as log files at first, or a dedicated DB table later.

### 7.1 Minimum logging

For each run:

- Start and end timestamps.
- Environment (dev/preview/prod).
- Number of:
  - Documents scanned.
  - Documents updated.
  - Documents skipped.
  - Chunks created/updated.
- Errors/warnings per document (if any).

### 7.2 Optional `ingestion_runs` table

In the future, consider a table like:

```sql
create table if not exists ingestion_runs (
  id uuid primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  environment text not null,
  docs_scanned integer,
  docs_updated integer,
  docs_skipped integer,
  chunks_written integer,
  error_count integer,
  notes text
);
```

Rerun scripts can insert a row at start, update it at the end, and log high-level stats.

---

## 8. Relationship to Validation

After a major ingest or rerun, it’s good practice to run a **validation suite** (Phase 4.4):

- Sample retrieval queries with known expected sources.
- Checks for:
  - Mode detection logic (Prospect/Owner/Navigation) still behaving as expected.
  - Archetype behavior not regressing (tone/emphasis, not facts).
  - Pricing guardrails intact (no numeric price leakage).
  - Safety content coming from the correct docs.

`V2_REDO_validation.md` will define these tests in more detail; this document only specifies that a rerun **should** be followed by validation for non-trivial changes.

---

## 9. Summary

- Ingestion is controlled by:
  - `V2_REDO_source-corpus.md` (which docs),
  - `V2_REDO_metadata-schema.md` (how docs are stored),
  - `V2_REDO_chunking-guidelines.md` (how docs are split),
  - `V2_REDO_embedding-stack.md` (how chunks are embedded).
- Reruns:
  - Use document-level checksums to minimize unnecessary work.
  - Overwrite embeddings for changed chunks, one active embedding per chunk.
  - Always respect pricing and safety guardrails.
- A developer should be able to:
  - Run `pnpm ingest:v2` (or equivalent) from docs alone.
  - Understand which docs were updated and why.
  - Rely on v2 behavior, without needing to peek into legacy v1 infrastructure docs.