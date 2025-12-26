# PerazziGPT v2 – Embedding Stack

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `PGPT/V2/AI-Docs/P2/Embedding-Stack.md`  
> Related docs:  
> - `Metadata-Schema.md`  
> - `Source-Corpus.md`  
> - `Chunking-Guidelines.md`  
> - `Infrastructure.md`  
> - `ReRun-Process.md` (placeholder)  
> - `Validation.md` (placeholder)  

This document defines the **embedding layer** for PerazziGPT v2:

- Which embedding model is used.  
- How text is preprocessed before embedding.  
- How embeddings are stored in Supabase.  
- How retrieval queries are expected to behave by default.  
- How embeddings are refreshed when documents change.

The emphasis for v2 is **quality of output over cost or absolute latency**.

---

## 1. Embedding Model Choice

PerazziGPT v2 uses **one canonical embedding model** across the entire corpus.

### 1.1 Primary model

- **Model:** `text-embedding-3-large`  
- **Rationale:**
  - Highest quality semantic representation among the available OpenAI embedding models.
  - Better handling of nuanced, long-form content such as the Making-a-Perazzi handbook and brand narrative docs.
  - Cost and throughput are acceptable for the expected corpus size and usage patterns; quality is prioritized.

### 1.2 Model usage

- All chunks (for all `Category` / `Doc_Type`) use `text-embedding-3-large`.  
- No multi-model setup is used in v2 (no “small for some docs, large for others”).  
- The `embedding_model` field in the `embeddings` table is always set to `"text-embedding-3-large"` for v2, but is retained for future flexibility.

---

## 2. Text Preprocessing

Text preprocessing happens **after chunking** and before calling the embedding API.

### 2.1 General rules

For each chunk:

1. **Preserve headings in the text**  
   - The chunk text should include the relevant section heading (or a short representation of it).
   - This improves grounding and makes chunk semantics clearer to the model.

2. **Normalize whitespace**
   - Convert multiple consecutive newlines to a single newline where it doesn’t break meaning.
   - Trim leading/trailing whitespace.
   - Normalize irregular spacing (tabs, multiple spaces) to single spaces when appropriate.

3. **Handle Markdown syntax**
   - Strip Markdown code fences (```...``` blocks) if present.  
   - Keep normal paragraphs, lists, and headings as readable text.
   - Remove any residual Markdown artifacts that don’t contribute to meaning (e.g., leftover fence markers).

4. **Preserve case**
   - Do **not** force lowercase.  
   - Preserve case as it appears; it can carry nuance (proper nouns, model names, etc.).

5. **Length check**
   - Chunking guidelines are designed to keep chunks within the model’s token limit.  
   - If a chunk somehow exceeds the safe limit for `text-embedding-3-large`, truncate conservatively at a sentence boundary and log a warning (see `ReRun-Process.md` once defined).

### 2.2 Special cases

- **Pricing metadata**  
  - For chunks derived from pricing CSVs:
    - Only descriptive fields (names, codes, categories, option labels) are included in the text.
    - All numeric pricing fields are excluded **before** embedding.
  - This respects both guardrails and keeps embeddings focused on structure, not amounts.

- **Highly structured JSON** (e.g., model details)
  - Convert into human-readable sentences or bullet-style lines before embedding:
    - “Model MX8: competition over-under platform used for …”
    - “Disciplines: sporting, FITASC.”
  - Avoid embedding raw JSON braces/keys where possible.

---

## 3. Storage & Schema Alignment

The embedding stack respects the schema defined in `Metadata-Schema.md`.

### 3.1 Where embeddings live

- Embeddings are stored in a dedicated `embeddings` table:

  - `chunk_id` → references `chunks.id`.
  - `embedding_model` → `"text-embedding-3-large"` for v2.
  - `embedding` → `vector` column (pgvector).
  - `embedding_norm` → optional precomputed L2 norm.
  - `created_at` → timestamp.

- Each chunk has **exactly one active embedding** for v2 (one row in `embeddings` for each `chunk_id`).

### 3.2 Relationship to `chunks`

- The ingestion pipeline:
  - Creates `chunks` rows first (text, metadata, etc.).
  - Then generates embeddings and writes to `embeddings`.
- `embeddings.chunk_id` is the foreign key that ties each vector back to:
  - The chunk text.
  - All associated metadata (category, doc_type, heading_path, primary_modes, archetype_bias, guardrail_flags, etc.).

---

## 4. Retrieval Defaults

The embedding stack assumes a **vector + metadata filter** retrieval pattern.

### 4.1 Similarity metric

- **Metric:** cosine similarity
- **pgvector operator:** `vector_cosine_ops`
- **Index:** as described in `Infrastructure.md` (We use an HNSW index on a half-precision view of the embedding).

### 4.2 Top-k and filters

**Defaults:**

- **Top-k**: 12 chunks per query (adjustable per endpoint, but 12 is the baseline).
- **Filters:**
  - Always restrict to:
    - `documents.status = 'active'`
    - `chunks.visibility = 'public'` (unless an internal/admin tool explicitly overrides this).
  - By default, exclude:
    - `Category = 'pricing-lists'` from generic retrieval unless:
      - The query is explicitly about options/structures **and**
      - The retrieval layer intentionally includes them.

**Optional filters (based on runtime logic):**

- `category` or `doc_type`  
  - e.g., prefer `making-a-perazzi` + `craftsmanship-handbook` for deep craft questions.
- `primary_modes`  
  - e.g., in Owner mode, slightly bias toward chunks marked with `"Owner"` in `primary_modes`.
- `guardrail_flags`  
  - e.g., avoid chunks with `"pricing_sensitive_source"` unless answering structural pricing questions.

### 4.3 Retrieval pipeline (conceptual)

A typical retrieval call will:

1. Accept:
   - User query text.
   - Runtime `mode` (Prospect/Owner/Navigation).
   - Optional archetype signal (for context, not for filtering facts).

2. Embed the query using `text-embedding-3-large`.

3. Query Supabase:
   - Vector similarity search on `embeddings.embedding` with `k = 12`.
   - Apply WHERE filters (status, visibility, optional category/doc_type, etc.).
   - Join to `chunks` and `documents` for metadata.

4. Return:
   - Top-k chunk texts + relevant metadata (paths, headings, section_labels, etc.)  
   - This bundle is provided to the model along with the behavior spec and guardrails.

---

## 5. Update & Rerun Strategy

### 5.1 When to re-embed

Embeddings must be recomputed when **any of the following** occur:

1. **Document content changes**
   - The underlying `.md`, `.json`, or `.csv` file is modified.
   - This may change chunk boundaries or text.

2. **Chunking rules change**
   - `Chunking-Guidelines.md` or `chunking.config.json` is updated in a way that alters how docs are split.

3. **Embedding model changes**
   - If v2 ever upgrades to a different embedding model, all embeddings must be recomputed.

### 5.2 Overwrite semantics

- v2 uses **one active embedding per chunk**:
  - On re-embed:
    - Delete or overwrite the existing `embeddings` row for that `chunk_id`.
    - Insert a new row with the latest `embedding` and `created_at`.

- We **do not** keep historical embeddings for now:
  - Simplifies maintenance.
  - Keeps storage and indexes focused on the current semantic space.

Any future need for multi-model or historical embeddings would involve extending the schema and this spec.

---

## 6. Rate, Batching & Operational Considerations

Even though cost is not a primary concern, v2 should behave politely and predictably.

### 6.1 Batching

- Use `EMBED_BATCH_SIZE` from environment variables:
  - Recommended starting value: `64` (can be adjusted).
- Group chunks into batches and send them in a controlled loop:
  - Respect OpenAI’s rate limits.
  - Retry transient failures with exponential backoff.

### 6.2 Concurrency

- A single ingestion worker (one process) is sufficient for v2:
  - Keeps logging and error handling simpler.
  - Future scaling (multiple workers or batch job orchestration) can be added if corpus grows significantly.

### 6.3 Logging

- For each ingestion run, log:
  - Number of chunks embedded.
  - Model used.
  - Total tokens sent.
  - Start/end timestamps.
  - Any errors or skipped chunks.

`ReRun-Process.md` (once written) will describe the full rerun flow and how to track ingestion runs persistently.

---

## 7. Relationship to Validation & Rerun Docs

- `Embedding-Stack.md` defines **how** embeddings are generated and used.
- `ReRun-Process.md` will define **when** and **in what sequence** to:
  - Detect changes,
  - Re-chunk,
  - Re-embed,
  - Clean up stale rows.
- `Validation.md` will define how to:
  - Confirm that retrieval behavior (top-k, filters, etc.) matches expectations.
  - Ensure that pricing and safety guardrails are being respected when embeddings are used in responses.

For now, this document serves as the **canonical reference** for embedding behavior in PerazziGPT v2.