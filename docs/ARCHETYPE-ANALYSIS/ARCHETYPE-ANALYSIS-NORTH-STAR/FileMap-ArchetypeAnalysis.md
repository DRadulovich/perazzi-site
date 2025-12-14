# Archetype Calculation and Pipeline File Map

---

## File 1 - `src/lib/perazzi-archetypes.ts`

### Purpose:
    Core archetype math—neutral vector, smoothing, heuristics from mode/page URL/model slug/user language, override/reset handling, signal logging, and the mode↔archetype bridge strings used for prompt guidance.

---

## File 2 - `src/app/api/perazzi-assistant/route.ts`

### Purpose:
    End-to-end pipeline: detects override/reset phrases, builds ArchetypeContext with prior vector, calls computeArchetypeBreakdown, threads archetype into guardrails/retrieval, and assembles the system prompt (includes archetype tone block, bridge guidance, and inline style exemplars) before calling OpenAI.

---

## File 3 - `src/types/perazzi-assistant.ts`

### Purpose:
    Data shapes for archetype, vector, breakdown, request context, and response fields passed between client and API.

---

## File 4 & 5 - `src/components/chat/useChatState.ts` and `src/hooks/usePerazziAssistant.ts`

### Purpose:
    Client-side context capture and persistence (page/model/platform/mode, prior archetype + vector), how those values are sent on each request, and how returned archetype data is stored for smoothing on the next turn.

---

## File 6 - `src/lib/perazzi-intents.ts`

### Purpose:
    Retrieval/topic hinting that feeds response templates and metadata into the system prompt alongside archetype/mode.

---

## File 7 - `src/lib/perazzi-retrieval.ts`

### Purpose:
    RAG inputs that reach the model (embedded user question → chunk selection → snippets injected into the system prompt) and how context like mode/platform influences retrieval boosts.

---

## File 8 - `src/lib/aiLogging.ts`

### Purpose:
    What archetype-related fields are recorded with each interaction (archetype, page URL, metadata) for analytics.

---

## File 9 - `scripts/ingest-v2.ts`

### Purpose:
    RAG ingestion metadata, including archetypeBias attached to chunks (potential signal source for archetype-aware retrieval, even if not currently consumed).

---

## File 10 - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-1/V2_REDO_assistant-spec.md`

### Purpose:
    Full behavior spec that’s inlined into every system prompt; contains the canonical mode/archetype rules the model is instructed to follow.

---