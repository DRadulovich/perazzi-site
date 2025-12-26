# V2_PGPT_New_Conversation_Starter.md

You are helping me with a very specific project: building PerazziGPT v2 – a deeply on-brand AI concierge for Perazzi USA (competition shotguns).

I’m going to describe the current system and where I want to take it next. Please read this carefully and treat it as the project context for this conversation.

---

## 1. High-Level Project Overview
- I have a Next.js app + Supabase + pgvector + OpenAI setup.
- We’ve already built and ingested a v2 knowledge corpus for PerazziGPT, structured specifically for:
  - Perazzi’s heritage, brand ethos, and writing tone.
  - A “Making-a-Perazzi” handbook (deep process descriptions: barrels, actions, fitting, etc.).
  - Gun info (models, platforms, ribs, manufacture-year mapping).
  - Company info (athletes, dealers, service centers, Olympic medals).
- The assistant isn’t a generic chatbot; it’s meant to act as a Perazzi concierge with:
  - 3 modes: Prospect, Owner, Navigation.
  - 5 archetypes: Loyalist, Prestige, Analyst, Achiever, Legacy.
  - Strong safety and brand guardrails (no DIY gunsmithing, no pricing, no competitor trashing, etc.).

The v2 system is already working well: it answers questions in Perazzi’s voice, uses Supabase RAG, and returns citations, mode, and archetype in the API response.

This new conversation is about one specific area:
🔹 evolving the archetype system from static/manual to a real, adaptive profile of the user.

---

## 2. Core v2 Files (Source of Truth)

These are the important files in my repo that define how v2 works:

### 2.1 Specs & Behavior (Phase 1)
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_assistant-spec.md  
  Defines how PerazziGPT should think and behave: mission, modes, archetypes, response rules, tone anchors.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_non-negotiable-guardrails.md  
  Hard safety, legal, and brand boundaries (pricing, gunsmithing, scope, privacy).
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_voice-calibration.md  
  Voice & tone guide: how to phrase answers by mode and archetype.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_use-case-depth.md  
  Canonical scenarios, success/failure signals, and corpus touchpoints for Prospect, Owner, Navigation.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_system-manifest.md  
  “Map of maps” – how all v2 docs connect across phases.

### 2.2 Corpus, Schema & Chunking (Phase 2)
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md  
  Lists which v2 documents are ingested and how they’re categorized/flagged.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_metadata-schema.md  
  Defines documents, chunks, embeddings schema in Supabase.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_chunking-guidelines.md  
  Explains how long docs get split into meaningful chunks with headings, labels, guardrail flags.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_embedding-stack.md  
  Embedding model choice (text-embedding-3-large), retrieval behavior, HNSW index on embedding::halfvec(3072).
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_rerun-process.md  
  Ingestion & rerun process: checksums, re-chunking, re-embedding when docs change.
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_validation.md  
  Validation & red-teaming playbook (retrieval tests, guardrail tests, behavior tests).

### 2.3 Retrieval, API & Types (Phase 3 + runtime)
- src/lib/perazzi-retrieval.ts  
  Uses the user’s question → embed with text-embedding-3-large → Supabase query over v2 embeddings/chunks/documents → returns scored chunks.
- src/app/api/perazzi-assistant/route.ts  
  API endpoint:
  - loads v2 assistant spec,
  - detects/uses mode,
  - supports a dev archetype override phrase (Please change my archetype to Analyst. etc.),
  - calls retrieval + gpt-4.1,
  - applies guardrails,
  - returns: answer, citations, guardrail, mode, archetype.
- src/types/perazzi-assistant.ts  
  Types for:
  - PerazziAssistantRequest,
  - PerazziAssistantResponse,
  - RetrievedChunk (which now has fields like chunkId, content, sourcePath, and some v2 metadata).
- V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-3/V2_REDO_api-contract.md  
  API contract for v2: request/response shape (including mode, archetype, and dev features).

### 2.4 UI (where responses are shown)
- src/hooks/usePerazziAssistant.ts  
  Hook that manages chat state, context (mode, etc.), and calls /api/perazzi-assistant.
- src/components/chat/ChatPanel.tsx  
  Renders the chat UI, messages, quick starts, and sends input to the assistant.
- src/components/concierge/ConciergePageShell.tsx  
  Page shell that hosts the chat, handles context updates, displays responses.

---

## 3. Archetype System – Current State

Right now, archetypes exist but are not fully profiled:
- 5 archetypes: Loyalist, Prestige, Analyst, Achiever, Legacy.
- The backend currently:
  - returns a single archetype field (e.g., "analyst" or null) in the API response,
  - supports manual override via dev phrase:
    - “Please change my archetype to Loyalist/Prestige/Analyst/Achiever/Legacy.”
- There is no dynamic profiling yet:
  - no archetype vector,
  - no scoring over time,
  - no persistent user profile.
- Archetype only affects framing and emphasis – not facts or safety.

This works great for dev and manual testing, but it doesn’t yet “learn” who the user is over time.

---

## 4. Archetype Analysis Roadmap (New Doc)

I’ve created a guide that describes the future system:
- docs/GUIDES/V2_PGPT_Archetype-Analysis-Roadmap.md

This roadmap defines phases to go from:
- “manual archetype field, no profiling”
- to
- “a stable, adaptive archetype profile per user that shapes explanations without breaking safety or truth.”

Phases in that roadmap:
- Phase A: Signal Design  
  Decide what signals hint at archetype:
  - user language patterns,
  - context (pageUrl, modelSlug),
  - user actions.
- Phase B: Initial Scoring & Smoothing  
  Start with a 5-element vector [Loyalist, Prestige, Analyst, Achiever, Legacy] and update it gently per message (no whiplash).
- Phase C: Session-Level Memory  
  Maintain a per-session archetype vector so responses get more “tuned” within a session.
- Phase D: Persistent Profiles  
  Persist archetype vectors for returning users (when identity exists), evolving slowly across sessions.
- Phase E: Integration into Retrieval & Voice  
  Use archetype to bias explanations, examples, and CTAs (NOT facts or safety).
- Phase F: UI & Controls  
  Show archetype info (e.g., “Loyalist 20%, Prestige 10%, Analyst 40%…”), and give the user controls to override, reset, or opt-out.

The roadmap is conceptual – it doesn’t include concrete code yet. That’s what I want this new conversation to focus on.

---

## 5. What I Want from You in This New Thread

In this conversation, I want you to:
1. Treat the files listed above (especially the roadmap: docs/GUIDES/V2_PGPT_Archetype-Analysis-Roadmap.md) as the design spec.
2. Help me implement the archetype profiling system step-by-step, starting small and safe:
  - Phase A/B first:
    - define signal extraction strategy,
    - design an in-memory archetype vector and basic scoring logic,
    - add an archetypeBreakdown field to the API response for dev (e.g., percentages for each archetype),
    - expose that to the front-end dev panel (like:
      - Loyalist: X%
      - Prestige: X%
      - Analyst: X%
      - Achiever: X%
      - Legacy: X%).
  - Then we can move toward session-level memory, and later persistent profiles.
3. Always preserve:
  - Perazzi’s voice and ethos,
  - hard safety guardrails (no pricing, no DIY dangerous work, no legal advice, no competitor trash),
  - and the principle that archetype changes how we explain, not what is true or safe.

We don’t need to do everything at once. Let’s start by:
- Designing a clean data model for the archetype vector and how it’s represented in the API response,
- Proposing where the scoring/updating logic should live (e.g., helper in src/lib/ vs inline in the route),
- And then we’ll implement Phase A/B in small steps.

I’ll tell you when I’m ready to start coding vs when I just want conceptual design.