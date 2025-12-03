# PerazziGPT v2 – Guideline Map

> Goal: Rebuild PerazziGPT from scratch on Supabase, using existing `.env.local` tokens and connectors, with clean behavior, corpus, and infrastructure – and full support for the 3 Modes × 5 Audience Segments architecture.

---

## 0. Core Principles

- **Single sources of truth**
  - [X] One canonical assistant spec.
  - [X] One canonical source corpus manifest.
  - [X] One canonical metadata schema.
- **Separation of concerns**
  - *Behavior* (how the assistant acts) lives in `V2_REDO_Phase-1`.
  - *Knowledge* (what it knows) lives in `V2_PreBuild-Docs` + `V2_REDO_source-corpus.md`.
  - *Infrastructure & RAG* live in `V2_REDO_Phase-2`.
  - *API / app wiring* lives in `V2_REDO_Phase-3`.
- **Mode + Archetype**
  - Every response is shaped by:
    - `mode ∈ {Prospect, Owner, Navigation}`
    - `archetype ∈ {Loyalist, Prestige Buyer, Analyst, Achiever, Legacy Builder}`

---

## Phase 1 – Establish V2 Project Skeleton (you’ve mostly done this)

**Folder:** `V2-PGPT/`

**Objective:** Lock in the v2 layout so no v1 artifacts bleed in.

**You already have:**

- `V2_PreBuild-Docs/` – domain knowledge only.
- `V2_REDO_Docs/`
  - `V2_REDO_Phase-1/` – assistant behavior & system manifest.
  - `V2_REDO_Phase-2/` – RAG, chunking, metadata, infra.
  - `V2_REDO_Phase-3/` – API contract.

**Success criteria:**

- No legacy `INTERNAL-PERAZZIGPT` folders left.
- All future PerazziGPT work happens in `V2-PGPT`.

---

## Phase 2 – Assistant “Brain” Spec (Behavior Layer)

**Folder:** `V2_REDO_Phase-1/`

**Objective:** Define exactly what PerazziGPT is, how it behaves, and how Modes + Archetypes work.

### 2.1 Rewrite `V2_REDO_assistant-spec.md`

- Replace its contents with the v2 spec that defines:
  - Mission & scope.
  - 3 interaction modes:
    - Prospect
    - Owner
    - Navigation / Guide
  - 5 audience archetypes:
    - Loyalist
    - Prestige Buyer
    - Analyst
    - Achiever
    - Legacy Builder
  - A 3 × 5 Mode × Archetype matrix:
    - `Primary_Emphasis`
    - `Tone_Guidance`
    - `Default_CTA`
  - High-level RAG behavior (uses Source Corpus v2 as only factual base).
  - Guardrail summary (no pricing, safety boundaries, etc).

### 2.2 Tighten `V2_REDO_non-negotiable-guardrails.md`

- Make it the canonical “thou shalt not” doc:
  - Safety & legal constraints.
  - Pricing rules.
  - Don’t-speculate rules.
- Cross-link it from the assistant spec (but keep it standalone).

### 2.3 Update `V2_REDO_voice-calibration.md`

- Lock in brand voice and style:
  - Perazzi tone (luxury, craft, quiet confidence).
  - Assistant tone variants per mode (Prospect vs Owner vs Nav).
  - How to *subtly* adjust tone per archetype without naming the archetype.

### 2.4 Refine `V2_REDO_use-case-depth.md`

- Explicitly define:
  - Core use cases for each mode.
  - Example conversations.
  - Failure modes to avoid (e.g., overselling, giving gunsmithing instructions).

### 2.5 Refresh `V2_REDO_system-manifest.md`

- Make this the **map** of the behavior layer:
  - Lists all Phase-1 docs and their roles.
  - Briefly explains how:
    - `assistant-spec` (brain),
    - `guardrails`,
    - `voice-calibration`,
    - `use-case-depth`
  - combine into the system prompt / tool config.

**Success criteria:**

- One can build the entire prompt stack just by reading Phase-1 docs.
- Modes and Archetypes are clearly defined and non-overlapping.

---

## Phase 3 – Corpus & Metadata Design (Knowledge Layer)

**Folder:** `V2_PreBuild-Docs/` + `V2_REDO_Phase-2/`

**Objective:** Decide **exactly** what the assistant is allowed to know and how we label it.

### 3.1 Build `V2_REDO_source-corpus.md`

- Treat this as **the ingestion contract**.
- For each category under `V2_PreBuild-Docs/`:

  1. **V2_Core-Brand-and-Strategy-Docs/**
     - `V2_brand-bible.md`
     - `V2_brand-ethos.md`
     - `V2_marketing-plan.md`
     - `V2_writing-tone.md`

  2. **V2_Company-Info-Docs/**
     - `V2_athletes.md`
     - `V2_authorized-dealers.md`
     - `V2_consumer-warning-notice.md`
     - `V2_olympic-medals.json`
     - `V2_recommended-service-centers.md`
     - `V2_scheduled-events.md`

  3. **V2_Gun-Info-Docs/**
     - `V2_manufacture-year.md`
     - `V2_RAG_corpus-models-details.json`
     - `V2_rib-information.md`
     - any FRONT-END-only JSON marked as **not** for RAG (e.g. `V2_FRONT-END_corpus-models-sanity.json`).

  4. **V2_Making-a-Perazzi-Docs/**
     - All 1_ / 2-A_ … 5_ docs.

  5. **V2_Operational-Docs/**
     - `V2_build-configurator-flow.json`
     - `V2_site-overview.md`

  6. **V2_Pricing-List-Docs/**
     - All `V2_*retail-price.csv`.

- For each file, include:
  - `Path`
  - `Category`
  - `Doc_Type` (e.g., `brand-strategy`, `company-info`, `craftsmanship-handbook`, `gun-specs`, `operational-flow`, `pricing-metadata`)
  - `Status` ∈ {`active`, `planned`, `deprecated`}
  - `Pricing_Sensitive` flag where applicable.
  - Notes on what *should* and *must not* be embedded.

- Explicitly:
  - Mark pricing CSVs as **pricing-sensitive**, embed **metadata only**, not numeric price fields.
  - Mark any FRONT-END-only JSON as non-RAG.

### 3.2 Define `V2_REDO_metadata-schema.md`

- Specify Postgres / Supabase-level schemas for:

  **`documents` table:**
  - `id`
  - `path`
  - `title`
  - `category`
  - `doc_type`
  - `status`
  - `tags` (JSONB)
  - `pricing_sensitive` (bool)
  - `created_at`, `updated_at`

  **`chunks` table:**
  - `id`
  - `document_id`
  - `chunk_index`
  - `text`
  - `heading_path` (e.g., `"2. Roles & Stations > 2-G Checkering > 3.4 Tradeoffs"`)
  - `section_labels` (JSONB)
  - `primary_modes` (optional, e.g. `["Prospect","Owner"]`)
  - `archetype_bias` (optional hints, e.g. `["Analyst","Legacy"]`)
  - `metadata` (free-form JSONB)
  - `created_at`, `updated_at`

  **`embeddings` table (if separate):**
  - `chunk_id`
  - `embedding` (vector)
  - `embedding_model`

  **`user_profiles` table:**
  - `user_id`
  - `archetype` (nullable)
  - `archetype_confidence`
  - `notes` (JSONB)

  **`conversations` / `messages` tables** (optional but nice):
  - Standard chat history structure.

### 3.3 Define `V2_REDO_chunking-guidelines.md` + `V2_REDO_chunking.config.json`

- Document chunking strategy:

  - Default chunk size (e.g., 800–1200 tokens) with ~10–15% overlap.
  - Split on Markdown headings (`#`, `##`, `###`) before raw token windows.
  - For `V2_Making-a-Perazzi-Docs`, keep each conceptual block (e.g. “3.4 Tradeoffs”) intact where possible.
  - For CSV/JSON, explain how to turn rows/entries into text chunks (e.g., one item per chunk or grouped by category).

- `chunking.config.json` holds machine-friendly rules:
  - Per-path overrides (e.g., longer chunks allowed for short docs).
  - Fields to include/exclude for CSVs (remove `Price`, keep `ItemName`, `Code`, etc).

**Success criteria:**

- A script could ingest **only** from `V2_REDO_source-corpus.md` and know exactly what to do per file.
- Metadata schema is clear enough to implement without guessing.

---

## Phase 4 – Supabase & Embedding Stack (Infrastructure Layer)

**Folder:** `V2_REDO_Phase-2/`

**Objective:** Decide how Supabase stores everything and how embeddings are created.

### 4.1 Finalize `V2_REDO_infrastructure.md`

- Describe:
  - Supabase project roles relevant to PerazziGPT.
  - Required extensions (e.g., `pgvector`).
  - Tables from `metadata-schema.md`.
  - Index strategies (e.g., vector index on `embeddings.embedding`).

### 4.2 Configure `V2_REDO_embedding-stack.md`

- Pick embedding model (e.g., `text-embedding-3-large`).
- Define:
  - Standard pre-processing (strip Markdown fences, normalize whitespace).
  - Embedding dimension and distance metric.
  - How to handle updates (re-embed on doc change).

### 4.3 Define `V2_REDO_rerun-process.md`

- Step-by-step process for:
  - When a doc changes → how to detect, re-chunk, re-embed, and update Supabase.
  - How to mark old chunks as stale if needed.
- Include safeguards:
  - Never ingest pricing values.
  - Log ingestion runs with timestamps and doc versions.

### 4.4 Define `V2_REDO_validation.md`

- Outline validation strategy:
  - Sample questions + expected doc origins.
  - Tests that confirm:
    - Correct mode detection.
    - Archetype tuning not broken.
    - Pricing guardrails intact.
  - How to log & review failures.

**Success criteria:**

- You could hand Phase-2 docs to a developer and they could build the Supabase + embedding pipeline without touching your brain.

---

## Phase 5 – Ingestion Pipeline Implementation

**Code location:** your Next.js / scripts folder (outside this guideline, but driven by the v2 docs).

**Objective:** Turn V2_PreBuild-Docs into Supabase rows.

**Process:**

1. Read `V2_REDO_source-corpus.md` to get active docs.
2. For each doc:
   - Parse and normalize text.
   - Chunk according to `V2_REDO_chunking-guidelines.md` + JSON config.
   - Generate embeddings via the configured model and existing `.env.local` keys.
   - Upsert into Supabase tables using the metadata schema.
3. Run basic validation as per `V2_REDO_validation.md`.

**Success criteria:**

- Supabase contains a clean, queryable corpus for v2.
- No v1 docs or random strays are present.

---

## Phase 6 – Runtime Logic: Modes, Archetypes, and RAG

**Folder:** `V2_REDO_Phase-3/` (`V2_REDO_api-contract.md`) + code.

**Objective:** Define how the app talks to PerazziGPT and how mode/archetype drive behavior.

### 6.1 Flesh out `V2_REDO_api-contract.md`

- Request shape:
  - `user_id`
  - `conversation_id`
  - `message`
  - optional `mode` override
- Response shape:
  - `assistant_message`
  - `mode`
  - `archetype` (if inferred)
  - `sources` (list of document paths / chunk ids used)
- Error semantics, rate limits, etc.

### 6.2 Mode Detection

- In backend:
  - Use either:
    - Simple heuristic rules + fallback LLM classifier, or
    - Pure LLM classification.
  - Map each incoming message to `Prospect`, `Owner`, or `Navigation`.

### 6.3 Archetype Inference

- Strategy:
  - Initial guess from language with an LLM classifier (Loyalist / Prestige / Analyst / Achiever / Legacy / “Unknown”).
  - Store `archetype` + confidence in `user_profiles`.
  - Optionally ask soft preference questions when confidence is low.
- Always treat archetype as **a hint**, not a prison.

### 6.4 Prompt Construction

- System prompt built from:
  - `V2_REDO_assistant-spec.md`
  - Guardrails summary
  - Voice calibration
- Inject runtime variables:
  - `mode`
  - `archetype`
  - Short guidance string derived from the Mode × Archetype matrix row.
- Add retrieved RAG chunks as context.

### 6.5 Retrieval Behavior

- For each chat turn:
  1. Determine if retrieval is needed (navigation-only questions may skip heavy RAG).
  2. Query Supabase embeddings:
     - Base query on the user message.
     - Optionally bias search by:
       - `doc_type` (e.g., craft docs for Analysts in Prospect/Owner mode).
       - `category` (heritage docs for Loyalists, etc.).
  3. Pass top-N chunks + citations to the model.

**Success criteria:**

- Each response logs:
  - mode
  - archetype
  - doc sources
- Behavior clearly matches the Mode × Archetype matrix, and content matches RAG sources.

---

## Phase 7 – Front-End Integration & UX

**Objective:** Hook PerazziGPT v2 into the Perazzi site UI.

- Chat widget / panel:
  - Respect Perazzi brand design.
  - Optionally expose a subtle “What matters most to you?” selector (performance / heritage / exclusivity / long-term / milestones) that maps to archetypes.
- Wire widget → API route defined in Phase-3.
- Ensure:
  - Authentication (if needed) passes `user_id`.
  - Conversation IDs persist across page loads where appropriate.

**Success criteria:**

- A user visiting the site can interact with PerazziGPT v2 end-to-end.
- Mode and archetype handling work for both anonymous visitors (session-scoped) and logged-in users.

---

## Phase 8 – Testing, Tuning, and Go-Live

**Objective:** Prove v2 is safer, smarter, and more “Perazzi” than v1.

- Build a test suite of prompts:
  - For each mode (Prospect / Owner / Nav).
  - For each archetype emphasis.
  - For critical guardrail scenarios (pricing, gunsmithing, safety).
- Run them regularly:
  - Before major corpus changes.
  - Before model version upgrades.
- Iterate on:
  - Mode classifier thresholds.
  - Archetype inference.
  - Retrieval filters.
  - Wording in assistant spec / voice doc.

**Success criteria:**

- v2 answers are consistently:
  - On-brand.
  - Grounded in actual docs.
  - Safe and conservative where appropriate.
  - Emotionally tuned to the user’s segment.

---

## Final State

When all phases are complete:

- `V2_REDO_Phase-1` fully defines **what** PerazziGPT is and how it behaves.
- `V2_REDO_Phase-2` fully defines **what it knows** and how RAG is implemented on Supabase.
- `V2_REDO_Phase-3` fully defines **how the app talks to it**.
- `V2_PreBuild-Docs` contains only the curated, versioned content you want in v2.
- Supabase holds a clean corpus aligned with the guideline docs.
- The live Perazzi site runs on this v2 stack, with Modes + Audience Segments quietly shaping every reply.