# PerazziGPT v2 – Source Corpus Manifest

> Version: 0.1 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md`  
> Purpose: Define exactly which V2 documents are eligible for RAG ingestion, how they are categorized, and what constraints apply (status, pricing sensitivity, etc.).

---

## 0. Principles

This file is the **only contract** for what PerazziGPT v2 is allowed to ingest into its RAG corpus.

- If a document is **not** listed here as `Status: active`, it **must not** be embedded.
- Documents may be present on disk but:
  - `Status: planned` → may be added later.
  - `Status: deprecated` → should be ignored going forward.
- Any ingestion script should:
  1. Parse this file.
  2. Build the list of active `Path` entries.
  3. Apply any documented flags (e.g., `Pricing_Sensitive`) during chunking and embedding.

**Key fields:**

- `Path` – relative path from repo root.
- `Category` – broad grouping (brand, company, gun info, etc.).
- `Doc_Type` – more specific purpose (e.g., `brand-strategy`, `craftsmanship-handbook`).
- `Status` – `active` | `planned` | `deprecated`.
- `Pricing_Sensitive` – `true` if document contains numeric pricing (even if we do not ingest those numbers).
- `Embed_Mode` – how to treat the file during ingestion (full, metadata-only, ignore).
- `Notes` – important caveats or instructions.

## 0.5 Priority Order Overview

When building the ingestion queue, use the following recommended priority order. Downstream retrieval can also bias by category in this order:

1. Core Brand & Strategy Docs  
2. Making-a-Perazzi Docs (Craftsmanship Handbook)  
3. Company Info Docs  
4. Gun Info Docs  
5. Operational Docs  
6. Pricing List Docs (metadata only)  

---

## 1. Global Rules

1. **Ingestion Scope**

   - Only include documents under:  
     `V2-PGPT/V2_PreBuild-Docs/`
   - Exclude by default:
     - Any file in `V2_REDO_Docs/` (behavior / infra specs, like this file).
     - Any file named `*guideline*` or clearly documenting process rather than Perazzi domain content, unless explicitly listed as `active`.

2. **Allowed File Types**

   - Markdown (`.md`)
   - JSON (`.json`)
   - CSV (`.csv`) with restrictions
   - Other formats are ignored unless explicitly added later.

3. **Pricing Data**

   - Files marked `Pricing_Sensitive: true`:
     - May be used only for **non-numeric metadata** (names, codes, categories, structure).
     - Numeric price fields must be **excluded** at chunking time.
   - PerazziGPT must not quote or estimate prices or give negotiation guidance.

4. **Front-End Only Files**

   - Some JSON/CSV may exist purely to power UI components.
   - These should be `Embed_Mode: ignore` unless they are explicitly designed as RAG data.

5. **Making-a-Perazzi Handbook**

   - All chapters in `V2_Making-a-Perazzi-Docs/` are intended to be a **core craftsmanship corpus**.
   - They should be ingested in full (subject to chunking rules), with rich metadata (part/chapter indices, etc.).

6. **Updates**

   - When a document is modified, its `Status` and `Notes` here should be kept in sync.
   - When promoting a `planned` document to `active`, update this file first, then rerun ingestion.

---

## 2. Corpus Overview (By Category)

Below are tables for each major category under `V2_PreBuild-Docs/`.  
Not every file must be present on day one; use `Status: planned` where needed.

### 2.1 Core Brand & Strategy Docs

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/`

These documents define Perazzi’s identity, tone, positioning, and key marketing frameworks. They strongly influence **how** PerazziGPT speaks and explains the brand.

| Path                                                                 | Category                 | Doc_Type            | Status   | Pricing_Sensitive | Embed_Mode   | Notes |
|----------------------------------------------------------------------|--------------------------|---------------------|----------|-------------------|-------------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_brand-bible.md        | core-brand-and-strategy  | brand-strategy      | active   | false             | full        | Canonical brand pillars, values, positioning. |
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_brand-ethos.md        | core-brand-and-strategy  | brand-ethos         | active   | false             | full        | High-level ethos, spirit of the brand. |
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_audience-psychology-and-archetypes.md | core-brand-and-strategy  | audience-psychology | active   | false             | full        | Motivational archetypes and how they relate to Perazzi. |
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_marketing-plan.md     | core-brand-and-strategy  | audience-definition | active   | false             | ignore        | Includes audience segments (Loyalist, Prestige, etc.). |
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/V2_writing-tone.md       | core-brand-and-strategy  | tone-guidance       | active   | false             | full        | Detailed writing style guidance; complements voice calibration doc. |
| V2-PGPT/V2_PreBuild-Docs/V2_Core-Brand-and-Strategy-Docs/README.md (if present)   | core-brand-and-strategy  | reference           | planned  | false             | full/ignore | Optional; clarify status if used. |

> Any additional `.md` files in this folder should start as `Status: planned` until explicitly listed here.

---

### 2.2 Company Info Docs

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/`

These documents describe Perazzi’s people, places, events, and official contacts.

| Path                                                                        | Category          | Doc_Type              | Status   | Pricing_Sensitive | Embed_Mode | Notes |
|-----------------------------------------------------------------------------|-------------------|-----------------------|----------|-------------------|-----------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_athletes.md                | company-info      | athletes              | active   | false             | full      | Profiles of key athletes / ambassadors. |
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_authorized-dealers.md      | company-info      | dealer-directory      | active   | false             | full      | Regions / dealer info; no pricing. |
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_consumer-warning-notice.md | company-info      | safety-notice         | active   | false             | full      | Official safety/consumer warning; must never be contradicted. |
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_olympic-medals.json        | company-info      | achievement-record    | active   | false             | full      | Structured data for Olympic/World titles; ingest as text summaries. |
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_recommended-service-centers.md | company-info  | service-centers       | active   | false             | full      | List of service centers; used heavily in Owner mode. |
| V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_scheduled-events.md        | company-info      | events                | active  | false             | full      | Event schedules; time-sensitive, consider refresh strategy. |

---

### 2.3 Gun Info Docs

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/`

These documents cover technical and historical information about Perazzi guns and configurations.

| Path                                                                             | Category      | Doc_Type            | Status   | Pricing_Sensitive | Embed_Mode   | Notes |
|----------------------------------------------------------------------------------|---------------|---------------------|----------|-------------------|-------------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_manufacture-year.md                | gun-info      | serial-year-mapping | active   | false             | full        | Mapping of serials/eras; used for “What year was my gun made?” |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-models-details.json     | gun-info      | model-details       | planned  | false             | full        | RAG-ready model descriptions; chunk by platform/model. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-models-specText.md      | gun-info      | model-spec-text     | active   | false             | full        | One section per model with specText line for variant-level retrieval. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-base-models.md          | gun-info      | base-model-index    | active   | false             | metadata-only | Index/list doc; keep for metadata/lookup only to reduce retrieval noise. RESTRUCTURE NEEDED if you want narrative explanations. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-disciplines.md          | gun-info      | discipline-index    | active   | false             | metadata-only | Index/list doc; keep for metadata/lookup only to reduce retrieval noise + oversized chunks. RESTRUCTURE NEEDED if you want narrative explanations. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-platforms.md            | gun-info      | platform-guide      | active   | false             | full        | Platform summary (HT/MX/DC/TM) with base-model rollups for routing. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_rib-information.md                 | gun-info      | configuration-guide | active   | false             | full        | Rib types and their intended behaviors. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_FRONT-END_corpus-models-sanity.json (if present) | gun-info | front-end-config    | planned  | false             | ignore      | Front-end mapping for Sanity/Next; not for RAG by default. |
| V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/gun_order_flow.json                   | gun-info      | build-configurator   | planned | false               | full        | Build configurator flow process |

> If additional gun-info files are added, list them here with appropriate `Doc_Type` and `Embed_Mode`.

---

### 2.4 Making-a-Perazzi Docs (Craftsmanship Handbook)

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/`

These documents describe the end-to-end build process and philosophy behind Perazzi competition shotguns. They form a core part of PerazziGPT’s “craft and process” knowledge.

Expected files (names may vary slightly; adjust as needed):

| Path                                                                                         | Category               | Doc_Type                | Status   | Pricing_Sensitive | Embed_Mode | Notes |
|----------------------------------------------------------------------------------------------|------------------------|-------------------------|----------|-------------------|-----------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/1_Product-and-System-Overview.md           | making-a-perazzi       | craftsmanship-handbook  | active   | false             | full      | Part I – product & system overview. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-A_Roles-and-Stations_Design-and-Specification-Definition.md | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-A. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-B_Roles-and-Stations_Action-and-Receiver-Machining.md       | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-B. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-C_Roles-and-Stations_Barrel-Fabrication-and-Regulation.md   | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-C. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-D_Roles-and-Stations_Trigger-Group-Lockwork-Assembly.md     | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-D. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-E_Roles-and-Stations_Stock-Blank-Selection-and-Rough-Shaping.md | making-a-perazzi | craftsmanship-handbook | active   | false             | full      | Part II – station 2-E. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-F_Roles-and-Stations_Stock-Inletting-and-Final-Shaping.md   | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-F. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-G_Roles-and-Stations_Checkering.md                           | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-G. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-H_Roles-and-Stations_Metal-Finishing-and-Bluing.md          | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-H. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-I_Roles-and-Stations_Wood-Finishing.md                       | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-I. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-J_Roles-and-Stations_Assembly-and-Mechanical-Quality-Control.md | making-a-perazzi | craftsmanship-handbook | active | false | full | Part II – station 2-J. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-K_Roles-and-Stations_Patterning-and-Performance-Testing.md  | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part II – station 2-K. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-L_Roles-and-Stations_Final-Fitting-and-Customer-Specific-Adjustments.md | making-a-perazzi | craftsmanship-handbook | active | false | full | Part II – station 2-L. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/2-M_Roles-and-Stations_Final-Inspection-ProofMarks-and-SignOff.md | making-a-perazzi | craftsmanship-handbook | active | false | full | Part II – station 2-M. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/3_CrossCutting-Systems.md                                      | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part III – cross-cutting systems. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/4_Perazzi-vs-General-Gunmaking.md                              | making-a-perazzi | craftsmanship-handbook  | active   | false             | full      | Part IV – Perazzi-specific vs general practices. |
| V2-PGPT/V2_PreBuild-Docs/V2_Making-a-Perazzi-Docs/5_Learning-Map.md                                              | making-a-perazzi | learning-map           | active   | false             | full      | Part V – learning map; useful for meta reasoning. |

> If additional handbook parts are added, include them here with `Doc_Type: craftsmanship-handbook` unless clearly meta.

---

### 2.5 Operational Docs

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Operational-Docs/`

These describe flows and structures that PerazziGPT may reference when guiding navigation or explaining processes.

| Path                                                                      | Category        | Doc_Type           | Status   | Pricing_Sensitive | Embed_Mode | Notes |
|---------------------------------------------------------------------------|-----------------|--------------------|----------|-------------------|-----------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Operational-Docs/V2_build-configurator-flow.json | operational   | flow-definition    | planned   | false             | full      | High-level logic for configurator; used to explain steps. |
| V2-PGPT/V2_PreBuild-Docs/V2_Operational-Docs/V2_site-overview.md          | operational     | site-map           | active   | false             | full      | Overview of site structure; useful in Navigation mode. |

---

### 2.6 Pricing List Docs

Folder: `V2-PGPT/V2_PreBuild-Docs/V2_Pricing-List-Docs/`

These hold pricing-related data. They are **pricing-sensitive** and must be treated carefully.

> **Rule:** For all CSVs here: `Embed_Mode: metadata-only`, `Pricing_Sensitive: true`.

Example entries (update file names as needed):

| Path                                                                         | Category      | Doc_Type        | Status   | Pricing_Sensitive | Embed_Mode      | Notes |
|------------------------------------------------------------------------------|---------------|-----------------|----------|-------------------|-----------------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_Pricing-List-Docs/V2_retail-price-shotguns.csv   | pricing-lists | retail-pricing  | planned   | true              | metadata-only   | Ingest only non-numeric fields (e.g., item names, codes, categories). |
| V2-PGPT/V2_PreBuild-Docs/V2_Pricing-List-Docs/V2_retail-price-parts.csv      | pricing-lists | parts-pricing   | planned   | true              | metadata-only   | Same rule; exclude numeric prices. |
| V2-PGPT/V2_PreBuild-Docs/V2_Pricing-List-Docs/V2_retail-price-services.csv   | pricing-lists | service-pricing | planned  | true              | metadata-only   | Activate once structure is stable. |

In the chunking pipeline, for any `metadata-only` pricing document:

- Extract **only**:
  - Descriptions
  - Product codes
  - Categories
  - Option names (e.g., engraving level, wood grade)
- Drop all numeric price / discount columns before embedding.
- Tag chunks derived from these docs with a guardrail flag in metadata (e.g., `guardrail_flags: ["pricing_sensitive_source"]`) so the runtime can treat them cautiously even though prices are removed.

---

### 2.7 Non-Corpus / Config Docs in `V2_PreBuild-Docs`

Some files in `V2_PreBuild-Docs` are **not** intended for RAG; they exist to help you and the system design.

| Path                                                                | Category      | Doc_Type        | Status   | Pricing_Sensitive | Embed_Mode | Notes |
|---------------------------------------------------------------------|---------------|-----------------|----------|-------------------|-----------|-------|
| V2-PGPT/V2_PreBuild-Docs/V2_guideline-map.md                        | config        | guideline-map   | active   | false             | ignore    | Internal roadmap; not for RAG. |

Any future process or meta docs added here should default to `Embed_Mode: ignore` unless you explicitly want the assistant to reference them.

---

## 3. Activation Checklist

Before (re)running ingestion for v2:

1. **Review Status Values**

   - Confirm every `active` entry is truly ready.
   - Demote any unstable doc to `planned`.

2. **Verify Paths**

   - Ensure each `Path` correctly matches the file on disk.
   - If you rename or move a file, update this manifest first.

3. **Confirm Pricing Flags**

   - Ensure all pricing-adjacent files have `Pricing_Sensitive: true` and `Embed_Mode: metadata-only`.

4. **Sync With Chunking & Metadata Schema**

   - Make sure:
     - `V2_REDO_metadata-schema.md` recognizes `Category`, `Doc_Type`, `Status`, `Pricing_Sensitive`, and `Embed_Mode`.
     - `V2_REDO_chunking-guidelines.md` has explicit rules for:
       - Making-a-Perazzi docs.
       - JSON model details.
       - Pricing CSVs.

---

## 4. Future Extensions

When adding new documents:

1. Place them in the appropriate folder under `V2_PreBuild-Docs/`.
2. Add a new row in the relevant table above with:
   - `Status: planned` initially.
3. Once the content is stable and aligned with v2:
   - Change `Status` to `active`.
   - Rerun the ingestion pipeline.

This keeps PerazziGPT v2’s knowledge **intentional, auditable, and tightly scoped** to the world you actually want it to inhabit.

---

## 5. Processing Guidelines

- Maintain the priority order from **0.5 Priority Order Overview** when building the ingestion queue so that foundational brand and craftsmanship docs are embedded first.
- For future sources (e.g., new CMS exports or site narrative files), add them here with a clear `Category`, `Doc_Type`, `Status`, and any exclusion rules before ingesting.
- If a document mixes pricing fields and narrative/explanatory text, split it into separate documents or ingestion units so that only the narrative sections are embedded.
- When in doubt about whether a file belongs in the corpus, keep it out (`Status: planned` or `Embed_Mode: ignore`) until you have a clear use case.
