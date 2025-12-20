# Token Budget Forensics - Perazzi Assistant

Audit date: 2025-12-16 (based on `tmp/logs/perazzi-prompt-debug.ndjson` with `prompt_tokens=32254`, `completion_tokens=1187`, `cached_tokens=5760`, `reasoning_tokens=286`, `total_tokens=33441`).

## Evidence sources
- Runtime prompt capture: `tmp/logs/perazzi-prompt-debug.ndjson` (messageCount=22, totalChars=81649).
- Prompt assembly: `src/app/api/perazzi-assistant/route.ts` (sanitization, guardrails, system prompt, cache/threading).
- Retrieval formatting: `src/lib/perazzi-retrieval.ts`.
- Responses wrapper and caching: `src/lib/aiClient.ts`, `src/lib/perazziAiConfig.ts`.
- Logging/Insights: `src/lib/aiLogging.ts`, console/file logs (`tmp/logs/perazzi-conversations.ndjson`).

## Prompt assembly map (no behavioral changes made)
- API: `POST /api/perazzi-assistant` -> `validateRequest` -> `sanitizeMessages` (keeps user+assistant only) -> `detectBlockedIntent` guardrails -> `retrievePerazziContext` -> `generateAssistantAnswer`.
- System instructions: `generateAssistantAnswer` builds `instructions = buildSystemPrompt(...) + toneNudge`, then calls `createResponseText`.
- `buildSystemPrompt` injects, in order: `V2_REDO_assistant-spec.md` (PHASE_ONE_SPEC) -> inline STYLE_EXEMPLARS -> Context line (mode/pageUrl/model) -> docSnippets (retrieved chunks formatted as `[chunkId] {content}\nSource: {title} ({sourcePath})`) -> optional response templates -> archetype guidance + bridge guidance -> relatability block -> final Markdown/writing rules.
- Model call: `createResponseText` forwards `prompt_cache_retention`, `prompt_cache_key`, `previous_response_id`, `reasoning`, `text.verbosity`, and `input` = full sanitized chat history.
- Chat history packing: `useChatState` sends the entire transcript (user and assistant messages, capped at 40) every turn; `previousResponseId` is also sent but history is not trimmed.
- Logging: `logAiInteraction` persists usage + metadata (prompt/response text omitted or truncated by env), `logInteraction` emits console/file NDJSON (retrieved chunk IDs + scores, guardrail status).

## Static prompt and guardrail blocks
Approx tokens use the observed ratio (0.395 tokens per character; 1 token ~ 2.53 chars).

| Component | Chars | Approx tokens | Notes |
| --- | ---: | ---: | --- |
| PHASE_ONE_SPEC (`V2_REDO_assistant-spec.md`) | 26,258 | ~10,373 | Full assistant spec with guardrails and policy text injected every call. |
| STYLE_EXEMPLARS (inline) | 5,653 | ~2,233 | Voice/tone exemplars appended after the spec each call. |
| Context line | 45 | ~18 | e.g., `Context: Mode: navigation | Page URL: /fschat`. |
| Tone nudge (`Stay in the Perazzi concierge voice...`) | 187 | ~74 | Added separately to instructions. |
| Archetype + bridge guidance | 908 | ~359 | Includes detected archetype (Analyst) plus bridge prompts. |
| Relatability block | 529 | ~209 | Fixed block, always appended. |
| Final Markdown/writing rules | 597 | ~236 | Bulleted response-format rules. |

## Retrieval payload sizing
- Observed: 15 retrieved chunks injected; formatted with chunkId + Source path on every chunk.
- Total retrieval payload: 14,587 chars (~5,762 tokens) -> ~18% of the 32k prompt tokens.
- Average chunk: 971 chars (~383 tokens); largest chunk is 1,861 chars (~735 tokens).

Per-chunk breakdown (from `tmp/logs/perazzi-prompt-debug.ndjson`):

| chunkId | Source (trimmed) | Chars | ~Tokens |
| --- | --- | ---: | ---: |
| 2103f213-46c5-4245-b3ef-d7507f727b8e | Source Corpus Manifest (site overview) | 538 | 213 |
| 79e7ab8c-d167-4c17-a219-ed70c89a5896 | Making a Perazzi - Checkering | 415 | 164 |
| 8f09cc03-e40d-47b8-ad75-7e7ca41c5854 | Making a Perazzi - Stock blank vignette | 1,155 | 456 |
| 12b5cfbf-c832-4aeb-ad81-32b9b4f2c06b | Athletes reference | 1,501 | 593 |
| 01fc7bb8-c24b-4404-8986-79154b26e4af | Making a Perazzi - Learning map | 1,054 | 416 |
| 0cbd0360-1ee7-4678-b880-bdeb198ec762 | Athletes reference | 1,543 | 610 |
| 933f47de-7fc2-4158-abca-d1e473865ddf | Source Corpus Manifest (site overview) | 411 | 162 |
| 15641de5-8469-4cfe-9ee4-18f895a8e85a | Source Corpus Manifest (site overview) | 597 | 236 |
| e86daf3c-5d59-49eb-a960-2b9697db8387 | Making a Perazzi - Checkering vignette | 879 | 347 |
| 8b7c0570-a25a-4d0b-b583-eb373e1d1506 | Source Corpus Manifest (site overview) | 402 | 159 |
| d6550305-3c09-48eb-be9a-ccdbc863ecce | Stock fitting communication notes | 608 | 240 |
| d70046ab-0cc6-454d-80de-41ebaf982f50 | David Radulovich athlete profile | 1,861 | 735 |
| 358a435e-08b3-4b21-a952-d49ff726c7ed | Barrel fabrication/regulation | 500 | 198 |
| 32f79d61-39c1-4e14-9319-f67f0ccdfbf7 | Wendell Cherry athlete profile | 1,799 | 711 |
| 159f1184-884d-4509-8dd1-79d4e3db857f | Dania Vizzi athlete profile | 1,292 | 510 |

Notes:
- Several chunks are long narrative vignettes or full athlete summaries, not trimmed excerpts.
- Source paths are long and repeated per chunk (`(title) (sourcePath)`), adding overhead.
- Retrieval limit in code defaults to 12, but 15 chunks were inserted (env override likely raised `PERAZZI_RETRIEVAL_LIMIT`).

## Chat history packing behavior
- History sent verbatim every turn (`useChatState` keeps up to 40 messages, no truncation/summarization).
- Observed transcript: 22 messages -> 12 user msgs (2,403 chars, ~949 tokens) + 9 assistant msgs (30,608 chars, ~12,091 tokens).
- The assistant history dominates history cost; one assistant turn alone is 7,089 chars (~2,800 tokens).
- Duplicate user input observed (same question repeated 3x), all still included.
- `previousResponseId` is forwarded to the Responses API but **history is still fully resent**, so threading does not reduce prompt size.

## Prompt caching and threading
- Knobs: `PERAZZI_PROMPT_CACHE_RETENTION` and `PERAZZI_PROMPT_CACHE_KEY` are forwarded; unset -> no caching. Observed `cached_tokens=5760`, implying some prefix was cached (likely part of the static system prompt).
- Stability issues for caching: the cacheable prefix currently includes dynamic fields (context line with mode/page URL and all docSnippets), so only the earliest portion can be cached. Retrieval chunks, archetype block, and full history bust the cache each turn.
- `previous_response_id` is supported end-to-end (client stores `responseId`, sends it next request), but the system still carries the entire transcript and fresh retrieval per call.

## Accounting table (approximate prompt-token makeup)

| Component | Chars | ~Tokens |
| --- | ---: | ---: |
| PHASE_ONE_SPEC | 26,258 | ~10,373 |
| STYLE_EXEMPLARS | 5,653 | ~2,233 |
| Context line | 45 | ~18 |
| Retrieval docSnippets (15 chunks) | 14,587 | ~5,762 |
| Archetype + bridge guidance | 908 | ~359 |
| Relatability block | 529 | ~209 |
| Final Markdown/writing rules | 597 | ~236 |
| Tone nudge | 187 | ~74 |
| User history (12 msgs) | 2,403 | ~949 |
| Assistant history (9 msgs) | 30,608 | ~12,091 |
| **Total prompt** | **81,649** | **~32,304** (matches observed `prompt_tokens=32,254`) |

## Primary causes of bloat (evidence-backed)
1) Very large static system prompt: spec (26k chars) + style exemplars (5.6k) are injected on every request with no caching-friendly separation.
2) Retrieval payload is both large (15 chunks, ~5.8k tokens) and verbose (full vignettes/athlete bios with long Source labels).
3) Full chat transcript (user + assistant) is resent every turn; assistant turns add ~12k tokens here alone.
4) Cache/previous-response threading is not leveraged to avoid repeating stable blocks; dynamic fields inside the instructions reduce cache hits.

## Top 10 token reducers (ranked)
1) Rely on `previous_response_id` + incremental history instead of resending full assistant transcript (expected reduction: up to ~12k tokens on long threads; risk: medium-must confirm Responses state retention and guardrail parity).
2) Split static system prompt into a cacheable prefix (spec/guardrails/style) and a dynamic tail (context/retrieval); ensure `prompt_cache_key` is stable (expected reduction: recover most of the 5.7k cached tokens on every call; risk: low).
3) Trim/summarize assistant history to last N turns or summary tokens (expected reduction: 6-10k tokens on multi-turn sessions; risk: medium-must preserve citations/guardrail context).
4) Cap retrieval chunk count and/or size (e.g., top 8 with 400-600 char excerpts) (expected reduction: 2-3k tokens; risk: medium-retrieval recall).
5) Shorten chunk formatting (remove repeated long Source paths; drop chunkId or move to citations only) (expected reduction: 500-800 tokens; risk: low).
6) Compress STYLE_EXEMPLARS into a shorter summary or move into cached prefix only (expected reduction: 1-2k tokens; risk: low).
7) Prune or modularize PHASE_ONE_SPEC into a minimal always-on core + mode/guardrail addenda (expected reduction: 3-4k tokens; risk: medium-must validate refusals).
8) Deduplicate user messages before send (skip repeated identical turns) (expected reduction: situational 200-500 tokens; risk: low).
9) Use intent/topic hints to fetch narrower retrieval slices (fewer athlete vignettes for technical questions) (expected reduction: 1-2k tokens; risk: medium).
10) Keep cacheable prefix free of dynamic context (avoid embedding page URL/mode in the cached block) (expected reduction: stabilizes cache hits; risk: low).

## PGPT Insights logging notes
- `logAiInteraction` stores usage (`input_tokens`, `output_tokens`, `cached_tokens`, `reasoning_tokens`), request/response IDs, and metadata (mode, guardrail status, archetype metrics). Prompt/response text is omitted or truncated per `PERAZZI_LOG_TEXT_MODE`.
- Retrieval debug logging is available via `PERAZZI_ENABLE_RETRIEVAL_DEBUG` (logs top chunks with scores/boosts); current file log includes chunk IDs and scores but not chunk lengths.
- `appendEvalLog` (dev/file) writes recent user prompts and retrieved chunk IDs to `tmp/logs/perazzi-conversations.ndjson`, but without sizes-helpful for correlating retrieval counts to usage spikes.

## Data pointers
- Prompt snapshot analyzed: `tmp/logs/perazzi-prompt-debug.ndjson`.
- Retrieval query and chunk formatting: `src/lib/perazzi-retrieval.ts` (limit default 12; env override observed at 15).
- Instruction assembly: `src/app/api/perazzi-assistant/route.ts:212-375` (`buildSystemPrompt`, `toneNudge`), caching params forwarded at `generateAssistantAnswer`.
- Chat history packing: `src/components/chat/useChatState.ts` (sends full history, tracks `previousResponseId` but does not trim history).
