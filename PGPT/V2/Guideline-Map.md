# PerazziGPT v2 – Guideline Map

> Goal: Rebuild PerazziGPT from scratch on Supabase, using existing `.env.local` tokens and connectors, with clean behavior, corpus, and infrastructure – and full support for the 3 Modes × 5 Audience Segments architecture.

---

## 0. Core Principles

- **Single sources of truth**
  - [X] One canonical assistant spec.
  - [X] One canonical source corpus manifest.
  - [X] One canonical metadata schema.
- **Separation of concerns**
  - *Behavior* (how the assistant acts) lives in `P1`.
  - *Knowledge* (what it knows) lives in `V2` + `Source-Corpus.md`.
  - *Infrastructure & RAG* live in `P2`.
  - *API / app wiring* lives in `P3`.
- **Mode + Archetype**
  - Every response is shaped by:
    - `mode ∈ {Prospect, Owner, Navigation}`
    - `archetype ∈ {Loyalist, Prestige Buyer, Analyst, Achiever, Legacy Builder}`

---

## Phase 1 – Establish V2 Project Skeleton (you’ve mostly done this)

**Folder:** `PGPT/`

**Objective:** Lock in the v2 layout so no v1 artifacts bleed in.

**You already have:**

- `V2/` – domain knowledge only.
- `AI-Docs/`
  - `P1/` – assistant behavior & system manifest.
  - `P2/` – RAG, chunking, metadata, infra.
  - `P3/` – API contract.

**Success criteria:**

- No legacy `INTERNAL-PERAZZIGPT` folders left.
- All future PerazziGPT work happens in `PGPT`.

---

## Phase 2 – Assistant “Brain” Spec (Behavior Layer)

**Folder:** `P1/`

**Objective:** Define exactly what PerazziGPT is, how it behaves, and how Modes + Archetypes work.

### 2.1 Rewrite `Assistant-Spec.md`

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

### 2.2 Tighten `NonNegotiable-Guardrails.md`

- Make it the canonical “thou shalt not” doc:
  - Safety & legal constraints.
  - Pricing rules.
  - Don’t-speculate rules.
- Cross-link it from the assistant spec (but keep it standalone).

### 2.3 Update `Voice-Calibration.md`

- Lock in brand voice and style:
  - Perazzi tone (luxury, craft, quiet confidence).
  - Assistant tone variants per mode (Prospect vs Owner vs Nav).
  - How to *subtly* adjust tone per archetype without naming the archetype.

### 2.4 Refine `Use-Case-Depth.md`

- Explicitly define:
  - Core use cases for each mode.
  - Example conversations.
  - Failure modes to avoid (e.g., overselling, giving gunsmithing instructions).

### 2.5 Refresh `System-Manifest.md`

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

**Folder:** `V2/` + `P2/`

**Objective:** Decide **exactly** what the assistant is allowed to know and how we label it.

### 3.1 Build `Source-Corpus.md`

- Treat this as **the ingestion contract**.
- For each category under `V2/`:

  1. **Brand-Strategy/**
     - `Brand-Bible.md`
     - `Brand-Ethos.md`
     - `Marketing-Plan.md`
     - `Writing-Tone.md`

  2. **Company-Info/**
     - `Athletes.md`
     - `Authorized-Dealers.md`
     - `Consumer-Warning.md`
     - `Olympic-Medals.json`
     - `Recommended-Service-Centers.md`
     - `Event-Schedule.md`

  3. **Gun-Info/**
     - `Manufacture-Year.md`
     - `All-Models-Corpus.json`
     - `Rib-Info.md`
     - any FRONT-END-only JSON marked as **not** for RAG (e.g. `SanityData-Models-List.json`).

  4. **Making-A-Perazzi/**
     - All 1_ / 2-A_ … 5_ docs.

  5. **Operational/**
     - `Build-Configurator-Flow.json`
     - `Site-Overview.md`

  6. **Pricing-Lists/**
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

### 3.2 Define `Metadata-Schema.md`

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

### 3.3 Define `Chunking-Guidelines.md` + `chunking.config.json`

- Document chunking strategy:

  - Default chunk size (e.g., 800–1200 tokens) with ~10–15% overlap.
  - Split on Markdown headings (`#`, `##`, `###`) before raw token windows.
  - For `Making-A-Perazzi`, keep each conceptual block (e.g. “3.4 Tradeoffs”) intact where possible.
  - For CSV/JSON, explain how to turn rows/entries into text chunks (e.g., one item per chunk or grouped by category).

- `chunking.config.json` holds machine-friendly rules:
  - Per-path overrides (e.g., longer chunks allowed for short docs).
  - Fields to include/exclude for CSVs (remove `Price`, keep `ItemName`, `Code`, etc).

**Success criteria:**

- A script could ingest **only** from `Source-Corpus.md` and know exactly what to do per file.
- Metadata schema is clear enough to implement without guessing.

---

## Phase 4 – Supabase & Embedding Stack (Infrastructure Layer)

**Folder:** `P2/`

**Objective:** Decide how Supabase stores everything and how embeddings are created.

### 4.1 Finalize `Infrastructure.md`

- Describe:
  - Supabase project roles relevant to PerazziGPT.
  - Required extensions (e.g., `pgvector`).
  - Tables from `metadata-schema.md`.
  - Index strategies (e.g., vector index on `embeddings.embedding`).

### 4.2 Configure `Embedding-Stack.md`

- Pick embedding model (e.g., `text-embedding-3-large`).
- Define:
  - Standard pre-processing (strip Markdown fences, normalize whitespace).
  - Embedding dimension and distance metric.
  - How to handle updates (re-embed on doc change).

### 4.3 Define `ReRun-Process.md`

- Step-by-step process for:
  - When a doc changes → how to detect, re-chunk, re-embed, and update Supabase.
  - How to mark old chunks as stale if needed.
- Include safeguards:
  - Never ingest pricing values.
  - Log ingestion runs with timestamps and doc versions.

### 4.4 Define `Validation.md`

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

**Objective:** Turn V2 into Supabase rows.

**Process:**

1. Read `Source-Corpus.md` to get active docs.
2. For each doc:
   - Parse and normalize text.
   - Chunk according to `Chunking-Guidelines.md` + JSON config.
   - Generate embeddings via the configured model and existing `.env.local` keys.
   - Upsert into Supabase tables using the metadata schema.
3. Run basic validation as per `Validation.md`.

**Success criteria:**

- Supabase contains a clean, queryable corpus for v2.
- No v1 docs or random strays are present.

---

## Phase 6 – Runtime Logic: Modes, Archetypes, and RAG

**Folder:** `P3/` (`API-Contract.md`) + code.

**Objective:** Define how the app talks to PerazziGPT and how mode/archetype drive behavior.

### 6.1 Flesh out `API-Contract.md`

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
  - `Assistant-Spec.md`
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

- `P1` fully defines **what** PerazziGPT is and how it behaves.
- `P2` fully defines **what it knows** and how RAG is implemented on Supabase.
- `P3` fully defines **how the app talks to it**.
- `V2` contains only the curated, versioned content you want in v2.
- Supabase holds a clean corpus aligned with the guideline docs.
- The live Perazzi site runs on this v2 stack, with Modes + Audience Segments quietly shaping every reply.