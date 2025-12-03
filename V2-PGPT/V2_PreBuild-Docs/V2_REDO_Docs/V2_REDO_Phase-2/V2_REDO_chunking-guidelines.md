

# PerazziGPT v2 – Chunking Guidelines

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_chunking-guidelines.md`  
> Purpose: Define **how** V2 corpus documents are split into chunks for embeddings, and how chunk-level metadata (heading paths, labels, mode/archetype hints, guardrails) should be derived.

---

## 1. Goals

The chunking pipeline should:

1. Produce chunks that are:
   - **Semantically coherent** (each chunk should “make sense” on its own).
   - **Appropriately sized** (good trade-off between context and retrieval precision).
   - **Traceable** back to specific sections and headings.

2. Respect:
   - The **V2 Source Corpus Manifest** (`V2_REDO_source-corpus.md`).
   - The **Metadata Schema** (`V2_REDO_metadata-schema.md`).
   - The **Assistant Spec** (`V2_REDO_assistant-spec.md`), especially Modes & Archetypes.

3. Provide:
   - `heading_path` and `section_labels` for better reasoning.
   - `primary_modes` and `archetype_bias` hints that reflect the type of content.
   - `guardrail_flags` for pricing-sensitive or safety-critical chunks.

These guidelines are **implementation-agnostic** but assume a tokenizer-based pipeline (e.g., 800–1200 token chunks with overlap).

---

## 2. Global Chunking Defaults

Unless overridden by a category-specific rule:

- **Target chunk size:**  
  800–1200 tokens (approximate), measured using the chosen embedding model’s tokenizer.

- **Maximum chunk size:**  
  ~1600 tokens. If a single section exceeds this, split by paragraph boundaries.

- **Overlap:**  
  10–15% of the previous chunk’s tokens (usually 80–150 tokens), ensuring continuity for long sections.

- **Split boundaries (priority order):**
  1. Markdown headings (`#`, `##`, `###`, etc.).
  2. Blank lines between paragraphs.
  3. Sentence boundaries.

- **Do not** split:
  - Inside code fences (rare in this corpus).
  - Inside short lists or tables when the list/table itself is the conceptual unit.

- **Language assumption:**  
  Default `language = "en"`. If a document is clearly another language, set `language` at doc-level and inherit to chunks.

---

## 3. Category-Specific Strategies

The `Category` and `Doc_Type` fields from `V2_REDO_source-corpus.md` should drive category-specific behavior.

### 3.1 Core Brand & Strategy Docs

**Folder:** `V2_Core-Brand-and-Strategy-Docs/`  
**Doc_Types:** `brand-strategy`, `brand-ethos`, `audience-definition`, `tone-guidance`

**Objectives:**

- Preserve conceptual sections (e.g., brand pillars, audience segments, tone rules).
- Avoid tiny chunks that separate “what” from “why”.

**Rules:**

- **Primary split:** by top-level headings (`#` and `##`).
- Within each section, aim for 600–1000 token chunks.
- Keep **audience segment** sections together where possible (e.g., one chunk per archetype if it fits).

**Metadata hints:**

- `primary_modes`: `["Prospect","Owner","Navigation"]`
- `archetype_bias`: `["Loyalist","Prestige","Analyst","Achiever","Legacy"]` (these docs are global)
- `section_labels`:
  - Include tags like `"brand-pillar"`, `"audience-segment"`, `"tone-guidance"` depending on heading text.
- `heading_path`: use the Markdown heading hierarchy, e.g.  
  `Brand Bible > Audience Segments > Loyalists`

---

### 3.2 Company Info Docs

**Folder:** `V2_Company-Info-Docs/`  
**Doc_Types:** `athletes`, `dealer-directory`, `safety-notice`, `achievement-record`, `service-centers`, `events`

#### 3.2.1 Athletes (`V2_athletes.md`)

- Split by **athlete profile**:
  - Each athlete becomes one or more chunks, depending on length.
- Keep bio, discipline, achievements, and relationships together if possible.

**Metadata hints:**

- `primary_modes`: `["Prospect","Owner","Navigation"]`
- `archetype_bias`: tilt toward `["Achiever","Loyalist","Legacy"]`
- `section_labels`: include `"athlete-profile"` and the athlete’s name as a label.
- `related_entities.models`: if the profile mentions specific models, include them.

#### 3.2.2 Dealer Directory & Service Centers

- Prefer **one chunk per region or country block**.
- Large regions can be split by state/province groups.
- Focus chunk content on:
  - Region name
  - Dealer/service names
  - Contact details (non-pricing)

**Metadata hints:**

- `primary_modes`: `["Prospect","Owner","Navigation"]`
- `archetype_bias`: neutral (`[]`) unless you want to bias toward `["Analyst","Legacy"]` for service docs.
- `section_labels`: `"dealer-directory"`, `"service-centers"`, plus region names.

#### 3.2.3 Safety Notice (`V2_consumer-warning-notice.md`)

- Chunk by logical sections (warnings, disclaimers, etc.).
- Keep any **critical safety paragraphs intact**; do not split mid-warning.

**Metadata hints:**

- `guardrail_flags`: include `"safety-critical"`
- `primary_modes`: `["Owner","Prospect"]`
- `archetype_bias`: `["Analyst","Legacy"]`
- `section_labels`: `"consumer-warning"`, `"safety"`

#### 3.2.4 Olympic Medals & Events

- For structured JSON (`V2_olympic-medals.json`), convert into:
  - Per-competition or per-era text blocks.
- Aim for chunks like:
  - “All Olympic medals by decade”
  - “World Championships by discipline”

**Metadata hints:**

- `section_labels`: `"olympic-medals"`, `"world-championships"`
- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: `["Loyalist","Achiever","Legacy"]`

---

### 3.3 Gun Info Docs

**Folder:** `V2_Gun-Info-Docs/`  
**Doc_Types:** `serial-year-mapping`, `model-details`, `configuration-guide`, `front-end-config (ignore)`

#### 3.3.1 Manufacture Year (`V2_manufacture-year.md`)

- If tabular, group serial ranges into **logical blocks** (e.g., per decade or per platform).
- Each chunk should let the assistant answer:
  - “For serial range X–Y, the production era is Z.”

**Metadata hints:**

- `section_labels`: `"serial-year-mapping"` plus decade tags.
- `primary_modes`: `["Owner","Prospect"]`
- `archetype_bias`: `["Analyst","Legacy"]`

#### 3.3.2 Model Details (`V2_RAG_corpus-models-details.json`)

- Treat each **model or platform** as a core unit.
- For each model:
  - Combine description, intended use, key configurations, and special notes into one or a few chunks.
  - Avoid separating core description from its typical disciplines.

**Metadata hints per chunk:**

- `section_labels`: include `"model-details"` and `"platform:<name>"`.
- `disciplines`: from the model’s intended use.
- `platforms`: list of platform codes (e.g., `["MX8"]`).
- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: depending on model:
  - Comp/flagship platforms → `["Achiever","Prestige","Analyst"]`
  - Classic/heritage platforms → `["Loyalist","Legacy","Analyst"]`

#### 3.3.3 Rib Information (`V2_rib-information.md`)

- Chunk by rib family/type and discipline:
  - One chunk per rib type if it fits (e.g., “High rib for bunker trap”, “Flat rib for sporting”).
- Keep:
  - Design rationale,
  - Typical pairings (choke, barrel length),
  - Trade-offs.

**Metadata hints:**

- `section_labels`: `"rib-info"`, `"configuration-guide"`
- `disciplines`: from section content.
- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: `["Analyst","Achiever"]`

#### 3.3.4 Front-End Config JSON

- `V2_FRONT-END_corpus-models-sanity.json` is `Embed_Mode: ignore` by default.
- Do **not** chunk or embed unless you decide to repurpose it for RAG later.

---

### 3.4 Making-a-Perazzi Docs (Craftsmanship Handbook)

**Folder:** `V2_Making-a-Perazzi-Docs/`  
**Doc_Type:** `craftsmanship-handbook`, `learning-map`

These documents are **central** to the assistant’s explanation of Perazzi craft.

**Global rules:**

- Respect the **section numbering** within each chapter.
- Prefer chunks that align with:
  - Major sections (e.g., `2. Overview`, `3. Inputs & Outputs`, `4. Failure Modes`).
  - Subsections like `3.4 Typical Decisions & Tradeoffs`.

**Chunking strategy:**

1. Split by top-level headings within each chapter (`#`, `##`).
2. For each section:
   - Group paragraphs into 600–1200 token chunks.
   - Try to keep entire subsections (e.g., `3.4`) in a single chunk if they fit.
3. If a section is very long:
   - Split at logical sub-headings or paragraph breaks, but **repeat the section title** at the top of each chunk in `heading` and `heading_path`.

**Metadata hints (defaults for handbook chunks):**

- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: `["Analyst","Legacy","Loyalist"]` (adjust if a section skews toward performance or aesthetics)
- `section_labels`: include:
  - `"making-a-perazzi"`,
  - part/section tags like `"roles-and-stations"`, `"cross-cutting-systems"`, `"perazzi-vs-general-gunmaking"`,
  - specific station codes (`"station:2-G-checkering"`, etc.).
- `heading_path`:  
  `Part II > 2-G Checkering > 3.4 Typical Decisions & Tradeoffs`

**Learning Map (`5_Learning-Map.md`):**

- Chunk by major maps/frameworks.
- Each chunk should capture a complete mental model or “how to read this handbook” pattern.

---

### 3.5 Operational Docs

**Folder:** `V2_Operational-Docs/`  
**Doc_Types:** `flow-definition`, `site-map`

#### 3.5.1 Build Configurator Flow (`V2_build-configurator-flow.json`)

- Convert into descriptive chunks:
  - One chunk per major phase of the configurator (e.g., “platform selection”, “barrels & ribs”, “stock & fit”).
- Each chunk should describe:
  - What choices the user makes at that stage.
  - What those choices influence downstream.

**Metadata hints:**

- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: `["Analyst","Achiever"]`
- `section_labels`: `"configurator-flow"`, plus phase names.

#### 3.5.2 Site Overview (`V2_site-overview.md`)

- Chunk by **site region** (e.g., “Shotguns”, “Bespoke Journey”, “Heritage”, “Service & Support”).
- Each chunk describes:
  - What sections of the site exist in that region.
  - What a user can accomplish there.

**Metadata hints:**

- `primary_modes`: `["Navigation","Prospect","Owner"]`
- `archetype_bias`: neutral unless region-specific.
- `section_labels`: `"site-overview"`, `"nav-region:<name>"`

---

### 3.6 Pricing List Docs (Metadata Only)

**Folder:** `V2_Pricing-List-Docs/`  
**Doc_Types:** `retail-pricing`, `parts-pricing`, `service-pricing`  
**Embed_Mode:** `metadata-only`  
**Pricing_Sensitive:** `true`

**Rules:**

- Do **not** embed numeric pricing data.
- Convert CSV rows into descriptive chunks that contain only:
  - Product/part names
  - Product/part codes
  - Categories (e.g., “barrel options”, “accessories”)
  - Option labels (e.g., “engraving level 3”, “SC2 wood”).

**Chunking strategy:**

- Group related rows by:
  - Category (e.g., all barrels, all accessories).
  - Product family (e.g., all entries for MX8 barrels).
- Aim for 400–800 token chunks since they are primarily metadata.

**Metadata hints:**

- `primary_modes`: `["Prospect","Owner"]`
- `archetype_bias`: `["Analyst","Prestige"]` (optional)
- `guardrail_flags`: must include `"pricing_sensitive_source"` for all chunks.
- Consider including `context_tags` like `"pricing-metadata"` and `"options-structure"`.

---

## 4. Deriving Chunk-Level Metadata

The chunker should derive as much metadata as possible automatically.

### 4.1 Heading & Section Labels

- **`heading`**: nearest heading above the first token of the chunk.
- **`heading_path`**:
  - Concatenate headings from outermost to innermost, e.g.  
    `Part II > 2-G Checkering > 3.4 Typical Decisions & Tradeoffs`.
- **`section_labels`**:
  - Include:
    - Normalized heading slugs (e.g., `"3.4-decisions-and-tradeoffs"`).
    - Functional tags based on heading keywords (e.g., `"failure-modes"`, `"tradeoffs"`, `"inputs-outputs"`).
    - For handbook stations, `"station:2-G-checkering"`.

### 4.2 Modes & Archetype Hints

- Use **category + doc_type** for defaults (as outlined in category sections).
- Optionally refine based on:
  - Presence of words like “service”, “maintenance”, “serial”, “warranty” → stronger Owner bias.
  - “History”, “heritage”, “timeline” → stronger Loyalist/Legacy bias.
  - “Performance”, “tolerances”, “patterning data” → stronger Analyst bias.

These hints are suggestions for retrieval and prompt-building, not hard constraints.

---

## 5. Implementation Sketch (Pseudo-Algorithm)

High-level algorithm the ingestion script could follow:

1. **Read Source Corpus Manifest**
   - Filter for `Status: active`.
   - For each entry, respect `Embed_Mode` and `Pricing_Sensitive`.

2. **For each active document:**
   - Load file contents.
   - Parse `## 0. Metadata` (if present) to help set:
     - `title`, `summary`
     - `series_*` fields (for Making-a-Perazzi)
     - doc-level tags (`disciplines`, `platforms`, `audiences`, `tags`).
   - Create/update `documents` row.

3. **Chunking:**
   - Apply global defaults and category-specific rules to produce chunks.
   - For each chunk:
     - Compute `heading`, `heading_path`, `section_labels`.
     - Fill `primary_modes`, `archetype_bias` from category defaults (plus any simple heuristics).
     - Inherit doc-level fields: `language`, `disciplines`, `platforms`, `audiences`, `visibility`, `confidentiality`, `guardrail_flags`.
     - For pricing docs, ensure `guardrail_flags` includes `"pricing_sensitive_source"` and exclude numeric price fields.

4. **Embeddings:**
   - For each chunk (except `Embed_Mode: ignore`):
     - Compute `token_count`.
     - Generate embedding (e.g., `text-embedding-3-large`).
     - Insert into `embeddings` table (or `chunks.embedding`).

---

## 6. Future Refinements

- Add per-document **chunking overrides** (e.g., max/min chunk size, special split markers).
- Allow `V2_REDO_chunking.config.json` to specify:
  - Per-path chunk sizes.
  - Stopwords/headings where splitting is preferred.
- Add support for:
  - “Pinned” chunks (e.g., critical safety notices) that receive special retrieval priority.
  - Cross-document link metadata for tightly coupled docs (e.g., models ↔ pricing metadata).

With these guidelines, the chunker has a clear playbook for how to handle each class of document in V2 and how to populate the metadata that PerazziGPT v2 depends on for high-quality, on-brand retrieval.