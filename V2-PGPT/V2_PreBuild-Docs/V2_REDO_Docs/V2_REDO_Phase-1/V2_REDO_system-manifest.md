# PerazziGPT v2 – System Manifest

> Version: 0.2 (Draft)  
> Owner: David Radulovich  
> File: `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_system-manifest.md`  

This document is the **map of maps** for PerazziGPT v2. It explains:

- Which V2 docs exist (by phase).  
- What each doc is responsible for.  
- How they fit together to define behavior, knowledge, and runtime wiring.

---

## 1. High-Level Architecture

PerazziGPT v2 is defined only by the documents under `V2-PGPT/*`; legacy v1 materials are intentionally excluded from this manifest. The v2 system is organized in three phases: Phase 1 sets behavior and voice, Phase 2 defines the corpus and RAG plumbing, and Phase 3 captures runtime and API contracts. The assistant runs only on what is described here.

Phase 1 establishes the conversational contract: the assistant spec codifies mission, scope, and the 3 interaction modes (Prospect, Owner, Navigation/Guide), while archetype nuance is handled through the five motivational patterns (Loyalist, Prestige, Analyst, Achiever, Legacy). Guardrails set hard legal and safety boundaries, voice calibration keeps tone aligned to brand ethos, and use-case depth documents spell out success paths per mode.

Phase 2 turns brand, craft, and operational content into a structured RAG corpus. The source-corpus manifest lists every eligible document and its ingestion status; the metadata schema defines Supabase tables for documents, chunks, and embeddings; and chunking guidelines dictate how text is split with heading paths, mode/archetype hints, and guardrail flags. Optional configs (chunking overrides, embedding stack, infra, rerun process, validation) keep ingestion reproducible and auditable.

Phase 3 defines the runtime and API contract: how runtime requests package mode, archetype, and retrieval context into system prompts, and how the app exchanges data with Supabase-backed RAG with stable request/response schemas and orchestration logic.

Together, these phases ensure that behavior (Phase 1) is always grounded in vetted V2 corpus data (Phase 2) and exposed through a predictable runtime surface (Phase 3).

---

## 2. Phase 1 – Behavior & Voice

Phase 1 defines the mission and scope of the assistant, the three interaction modes, the five archetypes, hard safety boundaries, voice and tone, and concrete use cases that show how the assistant should behave in real conversations.

| File | Role | Summary | Dependencies |
|------|------|---------|--------------|
| `V2_REDO_assistant-spec.md` | Top-level behavior spec | Defines mission, scope, mode/archetype matrix, response rules, and how runtime parameters steer prompts. | Leans on brand docs (`V2_brand-ethos.md`, `V2_writing-tone.md`) and informs all other phases. |
| `V2_REDO_non-negotiable-guardrails.md` | Hard safety & legal rails | Codifies forbidden topics, pricing boundaries, gunsmithing prohibitions, and privacy rules that constrain every reply. | Enforced alongside the assistant spec in all prompts and runtime logic. |
| `V2_REDO_voice-calibration.md` | Assistant voice & tone guidelines | Translates brand writing tone into conversational patterns per mode and archetype, with do/don’t phrasing. | Uses `V2_brand-ethos.md`, `V2_writing-tone.md`, and aligns with the assistant spec. |
| `V2_REDO_use-case-depth.md` | Scenario-level behavior by mode & archetype | Details canonical questions, flows, success/failure signals, and corpus touchpoints for Prospect, Owner, and Navigation modes. | Builds on the assistant spec and references corpus categories from Phase 2. |
| `V2_REDO_system-manifest.md` | This doc | System-wide map of v2 documents, phases, and their relationships. | References all Phase-1 docs and Phase-2/3 interfaces. |

---

## 3. Phase 2 – Corpus, Metadata & RAG Infrastructure

Phase 2 defines what enters the RAG corpus, how each asset is labeled, how text is chunked, and how embeddings and Supabase infrastructure are expected to work so retrieval is consistent and auditable.

| File | Role | Summary | Notes |
|------|------|---------|-------|
| `V2_REDO_source-corpus.md` | Corpus manifest | Canonical list of ingestible V2 documents with category, doc_type, status, pricing sensitivity, and embed mode. | Drives the ingestion allowlist and prioritization. |
| `V2_REDO_metadata-schema.md` | Metadata contract | Supabase-facing schema for `documents`, `chunks`, and `embeddings`, including mode/archetype hints, guardrail flags, and pricing markers. | Must mirror fields referenced in source-corpus. |
| `V2_REDO_chunking-guidelines.md` | Chunking strategy | Rules for splitting docs (token targets, heading paths, overlaps) plus mode/archetype bias labels and guardrail propagation. | Guides ingestion scripts; category-specific rules included. |
| `V2_REDO_chunking.config.json` | Machine-readable overrides | Draft config for per-path chunking exceptions and overrides. | Placeholder; to be filled as rules solidify. |
| `V2_REDO_embedding-stack.md` | Embedding model & pipeline | Placeholder for model choice, preprocessing, vector dims, and refresh cadence. | Planned; update when embedding stack is chosen. |
| `V2_REDO_infrastructure.md` | Supabase & infra notes | Placeholder for pgvector setup, indexing, and service wiring. | Planned; fill once the v2 stack is finalized. |
| `V2_REDO_rerun-process.md` | Re-ingestion process | Placeholder describing how to rerun ingestion when docs change. | Planned; to be written with the live pipeline. |
| `V2_REDO_validation.md` | Validation & test prompts | System-level validation and regression prompts for retrieval and safety. | Use as the validation playbook alongside the test harness. |

---

## 4. Phase 3 – Runtime & API Contracts

Phase 3 captures how the application talks to the assistant and RAG at runtime: API request/response shapes, how mode and archetype are injected into system prompts, and how retrieval results are packaged alongside guardrails.

| File | Role | Summary | Notes |
|------|------|---------|-------|
| `V2_REDO_api-contract.md` | API & runtime contract | Defines request/response schemas, prompt assembly, and Supabase retrieval orchestration. | Canonical runtime surface for mode/archetype packaging and citations. |

**Observability / Tuning**

- Server-side logging captures rerank + archetype confidence telemetry in metadata.
- Admin Insights UI is the intended tuning surface.

---

## 5. How Everything Fits Together

Authoring starts in `V2_PreBuild-Docs`: brand, craft, operational, and reference materials live there, while behavior and voice are defined in Phase 1. These inputs shape the assistant spec, guardrails, voice calibration, and use-case depth, ensuring every reply honors mission, safety, and tone.

Ingestion begins with `V2_REDO_source-corpus.md`, which selects eligible documents, categories, and flags. `V2_REDO_metadata-schema.md` sets how those assets are stored in Supabase, and `V2_REDO_chunking-guidelines.md` dictates how each file is split with heading paths, mode/archetype hints, and guardrail flags. Optional chunking overrides and the embedding stack determine exact tokenization and vectorization.

Runtime retrieval pulls chunks from Supabase based on the user message, guided by metadata from the schema and chunking rules. Phase 1 docs (assistant spec, guardrails, voice, use-case depth) provide the behavioral layer, while Phase 3 defines the exact API contract that binds requests, retrieval payloads, and system prompt assembly.

When responding, the assistant applies the 3 modes and 5 archetypes matrix from the assistant spec as a lens on top of retrieved corpus chunks. Mode influences intent handling (Prospect, Owner, Navigation/Guide), archetype steers structure + tone + emphasis (without labeling the user) gated by confidence, and guardrails enforce hard boundaries while RAG keeps facts anchored in the V2 corpus.

---

## 6. Change Management

- Adding a new domain doc: list it in `V2_REDO_source-corpus.md` with Status, Category, Doc_Type, pricing sensitivity, and embed mode before ingestion.
- Changing behavior or voice: update `V2_REDO_assistant-spec.md`, `V2_REDO_non-negotiable-guardrails.md`, and `V2_REDO_voice-calibration.md` together, then adjust use-case depth if flows change.
- Changing how data is stored: update `V2_REDO_metadata-schema.md` (and related Supabase migrations) plus any chunking rules that rely on schema fields.
- Rerunning ingestion: follow `V2_REDO_rerun-process.md` once populated; ensure embeddings and chunking configs are in sync.
- Changing request/response or orchestration: update `V2_REDO_api-contract.md` and ensure it matches the canonical TS contract.
- Updating this manifest: bump the version above and briefly note what changed so contributors can track the map itself.

## 7. Changelog

- 0.2 (Draft)
  - Phase 3 documented as the runtime/API contract layer (no longer a placeholder).
  - Validation doc marked as the system-level playbook rather than a placeholder.
  - Added tuning/observability note for rerank + archetype confidence telemetry.
  - Added change-management note for API contract updates and bumped manifest version.
