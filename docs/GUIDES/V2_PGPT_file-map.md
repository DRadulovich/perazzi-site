# PerazziGPT v2 – File Map & Roles

> This guide outlines the key files involved in the PerazziGPT v2 assistant: where they live and what they do, in plain language.

---

## 1. Specs & Behavior (V2-PGPT)

### 1.1 V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/...

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_assistant-spec.md`  
  **File Name:** `V2_REDO_assistant-spec.md`  
  **What It Does:** Defines how PerazziGPT should think and behave: mission, modes, archetypes, response rules, and tone anchors.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_non-negotiable-guardrails.md`  
  **File Name:** `V2_REDO_non-negotiable-guardrails.md`  
  **What It Does:** Hard safety, legal, and brand boundaries the assistant must never cross (pricing, gunsmithing, scope, privacy).

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_voice-calibration.md`  
  **File Name:** `V2_REDO_voice-calibration.md`  
  **What It Does:** Voice and tone guide translating brand writing style into assistant phrasing by mode and archetype.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_use-case-depth.md`  
  **File Name:** `V2_REDO_use-case-depth.md`  
  **What It Does:** Canonical scenarios, success/failure signals, and corpus touchpoints for Prospect, Owner, and Navigation modes.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_system-manifest.md`  
  **File Name:** `V2_REDO_system-manifest.md`  
  **What It Does:** “Map of maps” showing how all v2 docs connect across phases and how they shape the assistant.

---

## 2. Ingestion & Corpus

### 2.1 scripts/…

- **File Path:** `scripts/ingest-v2.ts`  
  **File Name:** `ingest-v2.ts`  
  **What It Does:** Reads the v2 docs, chunks them, creates embeddings, and loads them into Supabase’s documents/chunks/embeddings tables.

### 2.2 Supabase Schema & Chunking Docs

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md`  
  **File Name:** `V2_REDO_source-corpus.md`  
  **What It Does:** Lists which v2 documents are eligible for ingestion and how they are categorized and flagged.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_metadata-schema.md`  
  **File Name:** `V2_REDO_metadata-schema.md`  
  **What It Does:** Describes how documents, chunks, and embeddings are stored in Supabase, including key fields and flags.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_chunking-guidelines.md`  
  **File Name:** `V2_REDO_chunking-guidelines.md`  
  **What It Does:** Explains how long files are split into meaningful chunks with headings, labels, and guardrail flags.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_chunking.config.json`  
  **File Name:** `V2_REDO_chunking.config.json`  
  **What It Does:** Placeholder for machine-readable chunking overrides per path.

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_embedding-stack.md`  
  **File Name:** `V2_REDO_embedding-stack.md`  
  **What It Does:** Notes the embedding model choice and how vectors are handled for retrieval (draft for v2).

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_rerun-process.md`  
  **File Name:** `V2_REDO_rerun-process.md`  
  **What It Does:** Outlines how to rerun ingestion safely when source docs change (draft).

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_validation.md`  
  **File Name:** `V2_REDO_validation.md`  
  **What It Does:** Placeholder for regression tests and manual checks after ingestion updates.

---

## 3. Retrieval & API

### 3.1 Retrieval Logic

- **File Path:** `src/lib/perazzi-retrieval.ts`  
  **File Name:** `perazzi-retrieval.ts`  
  **What It Does:** Turns a user’s question into an embedding, looks up the closest v2 chunks in Supabase, and returns them with scores.

### 3.2 API Route

- **File Path:** `src/app/api/perazzi-assistant/route.ts`  
  **File Name:** `route.ts`  
  **What It Does:** API endpoint that runs retrieval, assembles the GPT prompt, applies guardrails, and returns the answer with citations, mode, and archetype.

### 3.3 Types

- **File Path:** `src/types/perazzi-assistant.ts`  
  **File Name:** `perazzi-assistant.ts`  
  **What It Does:** Defines the shapes of assistant requests, responses, citations, and retrieved chunks used across the stack.

### 3.4 Runtime Contract (Spec)

- **File Path:** `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_api-contract.md`  
  **File Name:** `V2_REDO_api-contract.md`  
  **What It Does:** Draft spec for how the runtime/API should package mode, archetype, and retrieval data in requests and responses.

---

## 4. Front-End UI

### 4.1 Components Using the Assistant

- **File Path:** `src/hooks/usePerazziAssistant.ts`  
  **File Name:** `usePerazziAssistant.ts`  
  **What It Does:** Client hook that manages chat state, context (mode, platform), and calls `/api/perazzi-assistant`.

- **File Path:** `src/components/chat/ChatPanel.tsx`  
  **File Name:** `ChatPanel.tsx`  
  **What It Does:** Renders the on-site chat interface (messages, quick starts, responses) and sends user input to the assistant API.

- **File Path:** `src/components/concierge/ConciergePageShell.tsx`  
  **File Name:** `ConciergePageShell.tsx`  
  **What It Does:** Full concierge page shell that hosts the assistant chat, handles mode/context updates, and displays responses with guardrail notes.

---

## 5. How to Use This Map

- **To change how the assistant thinks or speaks**, edit the specs in Section 1.  
- **To change what the assistant knows**, update the docs in Section 2 and rerun `scripts/ingest-v2.ts`.  
- **To change how the assistant is called or what it returns**, see the retrieval/API files in Section 3.  
- **To change what users see and how they interact**, update the UI files in Section 4.  
