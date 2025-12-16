# Dealer Authority Audit (Authorized Dealer Leakage)

-## LLM entrypoints & sampling
- `src/app/api/perazzi-assistant/route.ts:124-136,845-852` — Main chat endpoint uses Responses (`model=gpt-5.2` default via env), `temperature:0.4`, `max_output_tokens:3000`; system prompt (`instructions`) prepends `V2_REDO_assistant-spec.md` + style exemplars on every call. System/dev instructions: **closed-world intent** (grounded in V2 corpus) but no hard refusal when context is empty. Reasoning/verbosity/prompt-cache knobs are env-driven (`PERAZZI_REASONING_EFFORT`, `PERAZZI_TEXT_VERBOSITY`, `PERAZZI_PROMPT_CACHE_RETENTION`).
- `src/app/api/perazzi-assistant/route.ts:945-964` — System prompt injects retrieved chunks then says “Use the following retrieved references when relevant … If you are not certain, clearly state the limitation,” but still runs even when `docSnippets` is empty. Classification: **open-world fallback** (invites best-effort answer without context).
- `src/lib/perazzi-intents.ts:52-55,128-133` — Dealer intent detection routes dealer-like phrases to Navigation mode and injects template: “List up to three recommended dealers with Name — City/State …” Classification: **open-world nudge** (encourages listing dealers without requiring corpus support or “authorized” wording).
- `src/app/api/perazzi-assistant/route.ts:186-189,650-666` — Low-confidence gate defaults to `PERAZZI_LOW_CONF_THRESHOLD ?? 0`, so threshold is 0 unless overridden; low-conf message exists but is effectively disabled. Classification: **open-world** (allows answering on zero/weak retrieval).
- `src/app/api/perazzi-assistant/route.ts:138-177` — Additional system tone exemplars and guardrails (pricing/competitor refusals) appended to every prompt. Classification: neutral/brand guardrails, no retrieval enforcement.
- `src/app/api/perazzi-assistant/route.ts:637-688` — Retrieval happens once per call; no retry/backoff or min-chunk requirement before generation. Classification: **open-world fallback path**.
- Other chat-like endpoint: `src/app/api/soul-journey-step/route.ts:5-74` (Responses, default `gpt-5.2`, `temperature:0.6`, max output tokens 700) but unrelated to dealers.

## Instruction inventory (dealer relevance)
- **Closed-world / corpus-only instructions**
  - `V2_REDO_assistant-spec.md:83-87` — “Factual claims … must be grounded in the V2 RAG corpus. If the corpus is silent or ambiguous, acknowledge that and suggest a next step.”
  - `V2_REDO_assistant-spec.md:321-326` — “If the RAG corpus is silent … say so plainly … Avoid speculation … Suggest concrete next steps (authorized dealer/service center).”
  - `V2_REDO_non-negotiable-guardrails.md:56-62` — “Be explicit when the corpus does not contain enough verified information … prefer ‘I don’t have enough reliable detail’ … suggest authorized dealer/service center instead of speculation.”
  - `src/app/api/perazzi-assistant/route.ts:945-964` — Prompt footer: “If you are not certain, clearly state the limitation and offer to connect the user with Perazzi staff.”
  - `src/app/api/perazzi-assistant/route.ts:266-315` — Knowledge-source handler answers “I don’t search the open internet… built on curated Perazzi-specific information.” (closed-world stance).
- **Open-world / helpful best-effort instructions**
  - `src/lib/perazzi-intents.ts:128-133` — Dealer template to “List up to three recommended dealers…” with no “authorized” qualifier or citation requirement.
  - `src/app/api/perazzi-assistant/route.ts:951-964` — Even with `(No additional references available for this request.)`, the system prompt still proceeds, only suggesting (not enforcing) uncertainty language.
  - `src/app/api/perazzi-assistant/route.ts:186-189,650-666` — Low-confidence gate effectively disabled (threshold 0), so empty/low-similarity retrieval does not block generation.

## Conflict map (helpful vs corpus-only)
- Corpus-only mandate (V2 specs) vs dealer template that pushes proactive lists without checking retrieval/citations.
- Low-confidence/unknown-handling requirements in specs vs runtime gate set to 0 → model is never forced to defer when dealer chunks are missing.
- System prompt “use retrieved references when relevant” vs absence of a rule like “do not answer if none provided”; combined with temperature 0.4 yields plausible-but-uncited dealer names.

## Retrieval flow & fallback branches
- Flow: user query → `retrievePerazziContext` embeds with `text-embedding-3-large` → PG `embeddings` table query (limit 12; rerank optional, candidateLimit 60 if enabled) → optional rerank/boosting → return chunks + maxScore → low-confidence check (`maxScore < threshold`, threshold defaults to 0) → `buildSystemPrompt` injects chunks → `runChatCompletion`.
- Fallbacks leading to answers without dealer context:
  - If retrieval returns zero chunks (empty array), `maxScore` is 0 and still passes the threshold check; generation proceeds with `(No additional references available…)`.
  - No min-chunk or citation enforcement; templates still applied (dealer list prompt) even when chunks are empty or unrelated.
  - Candidate limit 12 with rerank off can drop dealer directory chunks for broad queries; no secondary fetch or “navigation” shortcut to the directory.
  - Retrieval debug is off by default; missing context not surfaced to caller unless env `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true` or `PERAZZI_ENABLE_FILE_LOG=true`.

## Sampling config (dealer-capable endpoint)
- Responses: `src/app/api/perazzi-assistant/route.ts` → default `gpt-5.2` (`PERAZZI_MODEL` / `PERAZZI_RESPONSES_MODEL`), `temperature 0.4`, `top_p` default (not set), `max_output_tokens 3000`, no seed. Reasoning/verbosity/prompt-cache knobs are env-driven.
- Embeddings: `text-embedding-3-large` (`PERAZZI_EMBED_MODEL`, default) for queries and archetype vectors.
- Rerank: disabled by default unless `PERAZZI_ENABLE_RERANK=true`; candidateLimit 60 when on, otherwise limit 12.

## Dealer data provenance & chunking risks
- Source doc: `V2-PGPT/V2_PreBuild-Docs/V2_Company-Info-Docs/V2_authorized-dealers.md` (dealer names + addresses; no explicit “authorized” repeated per entry).
- Chunking guidance: `PerazziGPT/Phase_2_Documents/Chunking_Guidelines.md:24-27` says 3–5 dealers per chunk and include the header “Perazzi USA Authorized Dealers” in each chunk.
- Actual chunk example (Supabase dump `docs/ARCHETYPE-ANALYSIS/SUPABASE/SQL-DUMPS/chunks_rows.sql:5280-5309`) shows a dealer block without the “Authorized” header in-text; only names/addresses remain. Signal of authorization may rely on metadata/title, making recall weaker for “authorized dealer” phrasing.
- No link from runtime to Sanity dealer table; authorized list is purely in the V2 corpus markdown + Supabase embeddings.

## Top 5 likely causes (ranked)
1) **Low-confidence gate disabled** — `src/app/api/perazzi-assistant/route.ts:186-189,650-666` sets threshold to 0, so empty/irrelevant retrieval still triggers generation. Next: confirm intended `PERAZZI_LOW_CONF_THRESHOLD` and add enforcement or logging when 0 chunks.
2) **Dealer template encourages free-form lists** — `src/lib/perazzi-intents.ts:128-133` asks for three “recommended dealers” regardless of retrieved context or “authorized” label. Next: constrain template to retrieved citations only or require “authorized” qualifier.
3) **System prompt allows best-effort without context** — `src/app/api/perazzi-assistant/route.ts:945-964` proceeds even when `docSnippets` is empty, only suggesting (not enforcing) uncertainty language. Next: add an explicit “Do not answer dealers without retrieved directory context” rule.
4) **Weak authorization signal in chunks** — `chunks_rows.sql:5280-5309` lacks the header; queries like “authorized dealer near me” may not match, pushing the model to general knowledge. Next: verify chunking preserved the header; re-run chunking to include “Authorized” token per chunk.
5) **Small candidate limit when rerank off** — `src/lib/perazzi-retrieval.ts:13-54,700-836` uses limit 12; broad navigation queries might surface other docs first, so dealer chunks never appear. Next: inspect retrieval logs for dealer queries with `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true` to see whether directory chunks are absent.

## Repro + debug checklist (optional)
- Set `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true PERAZZI_LOW_CONF_THRESHOLD=0.3` locally, run `/api/perazzi-assistant` with a dealer prompt (e.g., “list Perazzi dealers in Texas”). Check console for `perazzi-retrieval-debug` and `perazzi-assistant-log` entries showing returned chunk IDs/scores and whether any dealer-directory chunk was present.
- If chunks are empty, note that the current prompt still responds; toggle the threshold to confirm low-confidence behavior.
