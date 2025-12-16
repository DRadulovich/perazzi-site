

# PerazziGPT v2 – Metadata Schema

> Version: 0.2 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_metadata-schema.md`  
> Purpose: Define the canonical metadata schema for PerazziGPT v2 documents, chunks, and embeddings so that Supabase, the ingestion pipeline, and the runtime all agree on how knowledge is stored and retrieved.

---

## 1. Goals & Design Principles

This schema is the **contract** between:

- The **source corpus** (`V2_REDO_source-corpus.md`),
- The **ingestion pipeline** (which reads the corpus and writes to Supabase),
- The **runtime** (which performs RAG and builds prompts),
- And future tools (Codex scripts, audits, etc.).

Key principles:

1. **Separation of Concerns**
   - **Document-level** metadata describes each logical source file (e.g., a Making-a-Perazzi chapter).
   - **Chunk-level** metadata describes individual text chunks used for embeddings and retrieval.

2. **Alignment with Source Corpus**
   - Fields in `V2_REDO_source-corpus.md` like `Category`, `Doc_Type`, `Status`, `Embed_Mode`, and `Pricing_Sensitive` must appear in this schema and be faithfully preserved.

3. **Support Modes & Archetypes**
   - Chunk metadata should support light biasing for:
     - Interaction `mode` (Prospect, Owner, Navigation), and
     - Audience `archetype` (Loyalist, Prestige Buyer, Analyst, Achiever, Legacy Builder).

4. **Traceability & Safety**
   - Every chunk must be traceable back to:
     - Its source document,
     - Its approximate section (via `heading_path`),
     - Any relevant safety and pricing flags.

5. **Pragmatic Postgres**
   - The schema is written with Supabase/Postgres in mind but is conceptual:
     - Types like `text`, `timestamp`, `jsonb`, `integer`, and `vector`.
     - You may adjust specifics (e.g., enums vs. text) when implementing.

---

## 2. High-Level Tables

At minimum, PerazziGPT v2 expects three core tables:

1. `documents` – one row per logical source document (e.g., a single `.md` or `.json` file).
2. `chunks` – one row per ingestible text chunk linked to a document.
3. `embeddings` – one row per chunk embedding (or a vector column on `chunks`).

Optionally, additional tables like `user_profiles`, `conversations`, and `messages` will be defined elsewhere (Phase 3), but they may reference key metadata here (e.g., `guardrail_flags`).

---

## 3. `documents` Table Schema

**One row per V2 source file** that is considered a logical document.

Recommended columns:

```sql
documents (
  id                  uuid primary key,
  path                text not null,    -- matches Path from V2_REDO_source-corpus.md
  title               text,             -- human-readable title (from doc metadata or derived)
  summary             text,             -- brief 1–3 sentence summary (optional)

  -- Alignment with Source Corpus Manifest
  category            text not null,    -- e.g., core-brand-and-strategy, company-info, gun-info, making-a-perazzi, operational, pricing-lists, config
  doc_type            text not null,    -- e.g., brand-strategy, audience-definition, craftsmanship-handbook, learning-map, dealer-directory, etc.
  status              text not null,    -- active | planned | deprecated
  embed_mode          text not null,    -- full | metadata-only | ignore
  pricing_sensitive   boolean not null default false,

  -- Making-a-Perazzi series structure (nullable except for handbook docs)
  series_part_number       integer,     -- e.g., 1, 2, 3…
  series_part_roman        text,        -- e.g., I, II, III…
  series_part_title        text,        -- e.g., "Product & System Overview"
  series_chapter_code      text,        -- e.g., "2-G"
  series_chapter_title     text,        -- e.g., "Checkering"
  series_chapter_global_index integer,  -- global order across entire handbook
  series_chapter_part_index   integer,  -- order within part

  -- General document tags and descriptors
  language             text default 'en',
  disciplines          jsonb,           -- e.g., ["sporting", "bunker_trap"]
  platforms            jsonb,           -- e.g., ["MX8", "High Tech"]
  audiences            jsonb,           -- e.g., ["prospect", "owner", "navigation", "internal"]
  tags                 jsonb,           -- free-form tag list: ["heritage", "barrels", "fit-balance"]

  -- Access & safety
  visibility           text default 'public',   -- public | internal | admin-only
  confidentiality      text default 'normal',   -- normal | elevated
  guardrail_flags      jsonb,                   -- e.g., ["pricing_sensitive_source"]
  safety_notes         text,                    -- any doc-level safety caveats

  -- Versioning & traceability
  source_version       text,
  source_checksum      text,            -- hash of file contents at ingestion
  author               text,
  approver             text,
  stakeholders         jsonb,           -- e.g., ["Perazzi USA", "David Radulovich"]
  license              text,            -- if needed

  -- Housekeeping
  ingested_at          timestamp with time zone,
  last_updated         timestamp with time zone,
  effective_from       timestamp with time zone,
  expires_on           timestamp with time zone
);
```

**Notes:**

- For non-Making-a-Perazzi docs, `series_*` fields can be `NULL`.
- For pricing docs, `pricing_sensitive = true` and `guardrail_flags` should include something like `"pricing_sensitive_source"` at **document-level** as well as chunk-level.
- `path` must match the `Path` specified in `V2_REDO_source-corpus.md`.

---

## 4. `chunks` Table Schema

**One row per chunk of text** derived from a document.

Each chunk is what gets embedded (or referenced by the embedding row).

```sql
chunks (
  id               uuid primary key,
  document_id      uuid not null references documents(id) on delete cascade,

  chunk_index      integer not null,   -- 0-based index within the document
  chunk_count      integer,            -- total chunks for this document (optional but nice)
  text             text not null,      -- chunk content
  token_count      integer,            -- approximate token count

  -- Structural context
  heading          text,               -- closest heading / section title
  heading_path     text,               -- e.g., "Part II > 2-G Checkering > 3.4 Tradeoffs"
  section_labels   jsonb,              -- e.g., ["roles-and-stations", "3.4 Typical Decisions & Tradeoffs"]

  -- Mode & archetype hints (not runtime mode)
  primary_modes    jsonb,              -- e.g., ["Prospect", "Owner"] or ["Navigation"]
  archetype_bias   jsonb,              -- e.g., ["Analyst", "Legacy"]

  -- Domain descriptors (may override or refine document-level tags)
  language         text,               -- override if chunk is non-default language
  disciplines      jsonb,              -- e.g., ["sporting", "FITASC"]
  platforms        jsonb,              -- e.g., ["MX8", "High Tech"]
  audiences        jsonb,              -- e.g., ["prospect"] if content is clearly skewed

  -- Safety & guardrails
  visibility       text,               -- inherits from document by default
  confidentiality  text,               -- inherits from document by default
  guardrail_flags  jsonb,              -- e.g., ["pricing_sensitive_source", "requires_service_disclaimer"]
  safety_notes     text,               -- chunk-specific cautions if any

  -- Navigation & CTAs
  cta_links        jsonb,              -- e.g., [{ "label": "Find a dealer", "url": "/dealers" }]
  context_tags     jsonb,              -- e.g., ["heritage", "founder-story"]
  related_entities jsonb,              -- e.g., { "models": ["MX8"], "athletes": ["George Digweed"] }
  structured_refs  jsonb,              -- e.g., serial ranges, named diagrams, appendix refs

  -- Housekeeping
  created_at       timestamp with time zone,
  updated_at       timestamp with time zone
);
```

**Normalization (required):**
- Treat `primary_modes` and `archetype_bias` as case-insensitive sets; store normalized values to align ingestion and rerank.
- In ingestion, normalize by trimming whitespace, lowercasing (recommended), and de-duplicating.
- Order is not meaningful.
- Canonical `primary_modes`: `["prospect","owner","navigation"]`
- Canonical `archetype_bias`: `["loyalist","prestige","analyst","achiever","legacy"]`

**Semantics:**
- `archetype_bias: []` → neutral (no archetype weighting); all five archetypes → general-purpose (also no archetype weighting); subset of 1–4 → specialized (eligible for archetype-alignment weighting).
- `primary_modes` follows the same pattern: missing/empty → neutral; all three → general-purpose; subset → specialized.
- These fields are retrieval/rerank hints only and must not set runtime mode or archetype identity.

**Notes:**

- `primary_modes` and `archetype_bias` are hints. They don’t set runtime `mode` or `archetype` but can be used to:
  - bias retrieval when we **know** the user is in Owner + Analyst, etc.
- `heading_path` and `section_labels` are especially important in `V2_Making-a-Perazzi-Docs`, so the assistant can reconstruct context like:
  - “This chunk is from Part II, station 2-G, sub-section 3.4.”
- `guardrail_flags` should include pricing-related flags for chunks derived from `metadata-only` CSVs, even though the numeric values are stripped.

---

## 5. `embeddings` Table Schema

You may store embeddings directly on `chunks`, but a separate `embeddings` table can make migrations/multi-model support easier.

```sql
embeddings (
  chunk_id         uuid primary key references chunks(id) on delete cascade,
  embedding_model  text not null,         -- e.g., "text-embedding-3-large"
  embedding        vector not null,       -- pgvector column
  embedding_norm   real,                  -- optional, precomputed L2 norm
  created_at       timestamp with time zone
);
```

**Notes:**

- If you decide to keep `embedding` on `chunks` instead, keep the semantics the same.
- For multi-model experiments, you could extend this to allow multiple embeddings per chunk (composite PK on `[chunk_id, embedding_model]`).

---

## 6. Relationship to Source Corpus Manifest

`V2_REDO_source-corpus.md` defines **which files** are ingested and how. This schema defines **how** they land in Supabase.

For each `active` entry in the source corpus:

- The ingestion pipeline should create or update a row in `documents` with:

  - `path` ← `Path`
  - `category` ← `Category`
  - `doc_type` ← `Doc_Type`
  - `status` ← `Status`
  - `embed_mode` ← `Embed_Mode`
  - `pricing_sensitive` ← `Pricing_Sensitive`
  - `guardrail_flags` ← e.g., `["pricing_sensitive_source"]` for pricing lists
  - Any series fields for Making-a-Perazzi docs (from their `## 0. Metadata` sections).

- For each resulting chunk:
  - `document_id` set to the corresponding `documents.id`.
  - `guardrail_flags` inherited (and possibly extended) from the document.
  - `primary_modes` and `archetype_bias` can be derived via simple rules:
    - Core brand docs → `primary_modes: ["Prospect","Owner","Navigation"]`, `archetype_bias: ["Loyalist","Prestige","Analyst","Achiever","Legacy"]`
    - Making-a-Perazzi chapters → often `primary_modes: ["Prospect","Owner"]`, `archetype_bias` leaning toward `["Analyst","Legacy","Loyalist"]`.
    - Pricing CSV-derived chunks → `guardrail_flags` must include `"pricing_sensitive_source"`.

---

## 7. Example: Making-a-Perazzi Doc & Chunk (YAML)

### 7.1 Document-Level Example

```yaml
# documents row (conceptual)
id: "5f9c2cbd-2c1e-4fb3-9e02-6d2bfa29abcd"
path: "V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-G_Roles-and-Stations_Checkering.md"
title: "2-G – Checkering"
summary: >
  Handbook chapter describing the checkering station at Perazzi, including
  tools, process, tradeoffs, failure modes, and how checkering interacts with
  stock design and handling.
category: "making-a-perazzi"
doc_type: "craftsmanship-handbook"
status: "active"
embed_mode: "full"
pricing_sensitive: false

series_part_number: 2
series_part_roman: "II"
series_part_title: "Roles & Stations – \"Job-Shadow\" Chapters"
series_chapter_code: "2-G"
series_chapter_title: "Checkering"
series_chapter_global_index: 8
series_chapter_part_index: 7

language: "en"
disciplines: ["sporting", "FITASC"]
platforms: []
audiences: ["prospect", "owner"]
tags: ["woodwork", "stock-feel", "craftsmanship", "roles-and-stations"]

visibility: "public"
confidentiality: "normal"
guardrail_flags: []
safety_notes: null

source_version: "v1"
source_checksum: "sha256:..."
author: "David Radulovich"
approver: "David Radulovich"
stakeholders: ["Perazzi USA"]
license: null

ingested_at: "2025-03-01T12:34:56Z"
last_updated: "2025-03-01T12:34:56Z"
effective_from: null
expires_on: null
```

### 7.2 Chunk-Level Example

```yaml
# chunks row (conceptual)
id: "7e4dc699-0b09-4d2e-bb36-1f3a2674beef"
document_id: "5f9c2cbd-2c1e-4fb3-9e02-6d2bfa29abcd"
chunk_index: 3
chunk_count: 12
text: >
  3.4 Typical Decisions & Tradeoffs

  At the checkering station, artisans must balance grip security against the
  risk of making the pattern too aggressive for long shooting days. For a
  competition gun intended for high-volume sporting clays, finer points and
  slightly lower depth can maintain control without eating the hand. For a
  bunker trap setup, the pattern may be cut deeper to prioritize anchoring the
  hand through heavy recoil.

token_count: 210

heading: "3.4 Typical Decisions & Tradeoffs"
heading_path: "Part II > 2-G Checkering > 3.4 Typical Decisions & Tradeoffs"
section_labels:
  - "roles-and-stations"
  - "checkering"
  - "3.4-decisions-and-tradeoffs"

primary_modes:
  - "prospect"
  - "owner"
archetype_bias:
  - "analyst"
  - "legacy"

language: "en"
disciplines: ["sporting", "bunker_trap"]
platforms: []
audiences: ["prospect", "owner"]

visibility: "public"
confidentiality: "normal"
guardrail_flags: []
safety_notes: null

cta_links:
  - label: "Learn more about Perazzi stock work"
    url: "/shotguns/stock-fitting"
context_tags:
  - "craftsmanship"
  - "stock-feel"
related_entities:
  models: []
  athletes: []
structured_refs: {}

created_at: "2025-03-01T12:34:56Z"
updated_at: "2025-03-01T12:34:56Z"
```

### 7.3 Embedding Example

```yaml
# embeddings row (conceptual)
chunk_id: "7e4dc699-0b09-4d2e-bb36-1f3a2674beef"
embedding_model: "text-embedding-3-large"
embedding: [0.0123, -0.0456, ...]  # stored as a vector in Postgres
embedding_norm: 1.02
created_at: "2025-03-01T12:35:01Z"
```

---

## 8. Implementation Notes

- When implementing this schema in Supabase:
  - Consider using **enums** for `status`, `embed_mode`, and possibly `category` / `doc_type` for guardrails and consistency.
  - Use `jsonb` for arrays and structured fields (tags, modes, archetype_bias, guardrail_flags, related_entities, etc.).
  - Add indexes on:
    - `documents.path`
    - `documents.category`, `documents.doc_type`, `documents.status`
    - `chunks.document_id`, `chunks.heading_path`
    - `embeddings.embedding` (via pgvector index)

- The ingestion pipeline should be responsible for:
  - Mapping each source file’s `## 0. Metadata` and `V2_REDO_source-corpus.md` entry into a `documents` row.
  - Creating `chunks` with appropriate `heading_path`, `section_labels`, and hints (`primary_modes`, `archetype_bias`).
  - Populating `guardrail_flags` for pricing-sensitive and safety-critical content.

With this schema in place, PerazziGPT v2 has a **stable, explicit contract** for how all knowledge is stored and can evolve the corpus safely over time.

## Changelog

- 0.2 (Draft): added normalization + semantics for primary_modes/archetype_bias to match rerank expectations
