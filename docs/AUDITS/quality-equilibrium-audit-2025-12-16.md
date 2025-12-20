# PerazziGPT “Quality Equilibrium” Audit (2025-12-16)

Repository-grounded audit of how prompt structure, retrieval, history, caching, and guardrails interact to shape helpfulness, rule-following, and hallucination resistance.

## Call Graph (text)
- `POST /api/perazzi-assistant` (`src/app/api/perazzi-assistant/route.ts:350`) → rate limit + origin gate → JSON parse + `validateRequest` (`:753`) + length guard (`:390`).
- Sanitize/derive context: `sanitizeMessages` (`:767`), `detectRetrievalHints` + `previousResponseId`, mode/text verbosity derivation.
- Meta shortcuts: assistant-origin and knowledge-source handlers return fixed answers and skip model call (`:418-500`).
- Archetype handling: reset/override shortcuts return early (`:502-593`); otherwise compute breakdown/classification (`:541-566`).
- Guardrails before retrieval: `detectBlockedIntent` refusal (`:773`) → logs (`logInteraction`, `logAiInteraction`) and returns block (`:594-655`).
- Retrieval path: build response templates (`src/lib/perazzi-intents.ts:314`), enrich context with archetype vector, call `retrievePerazziContext` (`src/lib/perazzi-retrieval.ts:48`), merge metrics.
- Low-confidence gate: if `maxScore < getLowConfidenceThreshold()` → returns `LOW_CONFIDENCE_MESSAGE` (`src/app/api/perazzi-assistant/route.ts:673-697`), guardrail status `low_confidence`.
- Generation path: `generateAssistantAnswer` (`:815`) → `buildSystemPrompt` (`:924`) → `toneNudge` append (`:832-834`) → `createResponseText` (`:881-907`) with `instructions` + full sanitized history, caching/thread params, logging (`logAiInteraction`).
- Response assembly: citations via `mapChunkToCitation` (`:1040`), guardrail ok, responseId returned to client.

## Prompt Block Inventory & Injection Order (verified)
Order inside `buildSystemPrompt` (`src/app/api/perazzi-assistant/route.ts:924-1025`):
1. `PHASE_ONE_SPEC` loaded from `V2_REDO_assistant-spec.md` (`:146-155`).
2. `STYLE_EXEMPLARS` block (`:158-196`).
3. Context summary line (mode/model/page) (`:937-950`).
4. Retrieved `docSnippets` per chunk: ``[chunkId] content\nSource: title (sourcePath)`` (`:931-936`, `:1012-1014`).
5. Optional response templates (bulleted) (`:952-956`).
6. Archetype guidance block (always present; even “none detected”) plus archetype tone text if set (`:958-987`).
7. Mode/archetype bridge guidance (`:990-994`).
8. Relatability block (`:996-1003`).
9. Closing Markdown rules (`:1021-1025`).
10. Separate `toneNudge` appended after the system prompt (`:832-834`), making it the most recent instruction.

Templates come from `buildResponseTemplates` (`src/lib/perazzi-intents.ts:314-327`), driven by detected intents/archetype variants.

## Quality-Risk Map (helpfulness, rule reliability, hallucination)
- **Guardrail dilution / conflicts:** Pricing, gunsmithing, legal refusals appear in both `BLOCKED_RESPONSES` (`src/app/api/perazzi-assistant/route.ts:43-52`) and style exemplar refusals (`:185-196`), plus spec guardrails (`V2_REDO_assistant-spec.md:312-331,322-325`). Mixed severity and placement risk inconsistent refusals. Low-confidence threshold defaults to 0 (`getLowConfidenceThreshold`, `:206-209`), effectively disabling the fallback message even when retrieval is irrelevant.
- **Instruction overload:** System prompt begins with a 12k+ token spec + long style exemplars, followed by contextual scaffolding and templates; final Markdown/tone nudges arrive late. Critical grounding/guardrails compete with narrative tone blocks and archetype/relatability guidance (`:971-1025`).
- **Retrieval contamination:** `docSnippets` include full chunk text and repeated `Source: {title} ({sourcePath})` per chunk (`:931-936`), encouraging model fixation on chunk headers. Titles default to document_path when missing (`src/lib/perazzi-retrieval.ts:884-892`), so repeated paths amplify noise.
- **History inertia:** All assistant + user turns (capped at 40) are resent every call (`src/components/chat/useChatState.ts:99-106,191-203`), while `previousResponseId` is also supplied (`:185-201`). Long assistant replies dominate context; no summarization or pruning beyond count cap (no truncation logic found via `rg` search).
- **Cache instability:** Dynamic context line, docSnippets, templates, archetype guidance, and relatability are inside the cached `instructions` block. With retrieval and history changing every turn, prompt caching (`PROMPT_CACHE_RETENTION`/`PROMPT_CACHE_KEY`) rarely reuses the static prefix despite being forwarded (`src/app/api/perazzi-assistant/route.ts:889-891`).
- **Hallucination/authority leakage:** Retrieval admits narrative/bio chunks and pricing metadata; no chunk guardrail filtering beyond visibility checks (`src/lib/perazzi-retrieval.ts:747-755`). Low-confidence gate off by default plus style blocks encouraging storytelling increase risk of confident but ungrounded answers.

## Salience Map (likely ignored instructions & recency)
- Early blocks (spec + style exemplars) dominate length; later critical rules (Markdown/uncertainty statements) are brief (`src/app/api/perazzi-assistant/route.ts:1021-1025`) and may be lost among archetype/relatability text.
- `toneNudge` is last (`:832-834`), so tone guidance may override earlier brevity/structure requirements.
- Style exemplars include multi-paragraph poetic responses (`:158-196`), conflicting with “concise, short paragraphs” closing rules; models may favor long-form exemplar style over concise directives.
- Archetype guidance always included, even when archetype is null (`:971-987`), adding extra tone pressure that can dilute strict guardrails.
- History recency bias: newest user message is last in `input`, but 40-message history plus long prior assistant turns reduce salience of current instructions; no “last-N user” filtering.

## Retrieval Contamination & Formatting Overhead
- Formatting string repeats labels per chunk (`src/app/api/perazzi-assistant/route.ts:931-936`); repeated `Source:` lines inflate prompt and emphasize sources over content.
- CHUNK_LIMIT default 12 (`src/lib/perazzi-retrieval.ts:14`); rerank off by default (`:52`), so first 12 by vector distance may include bios/heritage when question is technical.
- Titles fall back to document path (`src/lib/perazzi-retrieval.ts:884-892`), so multiple chunks from one doc share the same label, increasing duplication.
- Retrieval debug logs (if enabled) expose candidate lists but no length filtering (`:763-818,864-918`), so long narrative chunks remain untrimmed.
- No filtering on `guardrail_flags` fields returned from DB (`:726-739`)—flags are retrieved but unused, so sensitive content could slip through if present.

## History Self-Contamination Risks
- Client sends `fullHistory` of user+assistant messages (`src/components/chat/useChatState.ts:191-203`); `sanitizeMessages` keeps both roles unchanged (`src/app/api/perazzi-assistant/route.ts:767-771`), so every prior assistant answer is re-injected verbatim.
- No summarization/deduplication (`rg` found none in `src/components/chat`, `src/lib`, `src/app`), so long assistant turns and repeated user questions keep growing until cap 40.
- `previousResponseId` threading (`src/components/chat/useChatState.ts:255-256`) is combined with full history instead of replacing it, so Responses’ state + duplicated history may bias toward earlier assistant narratives.
- Prompt-debug log shows 22 messages, 81k chars (`tmp/logs/perazzi-prompt-debug.ndjson`), evidencing large compounded prompts and repeated user turns.

## Cache-Busting Dynamics
- Cache parameters parsed once (`PROMPT_CACHE_RETENTION`, `PROMPT_CACHE_KEY`, `src/app/api/perazzi-assistant/route.ts:118-125`) and forwarded to Responses (`:889-891`, `src/lib/aiClient.ts:228-233`).
- Cached prefix is invalidated every turn because `buildSystemPrompt` embeds: context summary (mode/page), retrieval snippets, templates, archetype guidance, relatability block, and “When composing” rules. History (`input`) also changes each turn.
- `PROMPT_CACHE_KEY` is global, not session-scoped, so enabling it would mix user contexts unless carefully set; no per-user key derivation present.

## Guardrail Enforcement & Logging Map
- **Pre-model:** `detectBlockedIntent` keyword checks for system meta/pricing/gunsmithing/legal (`src/app/api/perazzi-assistant/route.ts:773-803`). No moderation/PII filter or model-side safety call.
- **Low confidence:** returns canned message only if `maxScore` below env threshold (defaults to 0) (`:673-697`), so effectively never triggers unless env set.
- **In-prompt:** Spec + style refusal patterns and safety rules (`V2_REDO_assistant-spec.md:312-338,322-325`) embedded each turn; `toneNudge` reiterates “avoid pricing or legal guidance” (`src/app/api/perazzi-assistant/route.ts:832-834`).
- **Post-model:** None; no validation of output, citations, or refusal correctness.
- **Logging:** `logInteraction` prints JSON and optional NDJSON file (`:1049-1073`), including guardrail status, intents/topics, templates, retrieval scores. `logAiInteraction` writes to DB when `PERAZZI_AI_LOGGING_ENABLED` is true, with prompt/response text gated by `PERAZZI_LOG_TEXT_MODE` (`src/lib/aiLogging.ts:9-26,159-281`). Guardrail blocks also logged (`src/app/api/perazzi-assistant/route.ts:594-642`).

## Evaluation Harness Status
- Automated tests cover parsing/caching edge cases but not quality: `tests/api/perazzi-assistant.test.ts` checks env parsing and thresholds; no rubric-based or grounding/citation/refusal tests.
- PGPT Insights dashboards rely on `perazzi_conversation_logs` DB entries; logging omitted unless env is enabled, and prompt/response may be truncated/omitted (`src/lib/aiLogging.ts:193-223`), so QA views can miss text.
- No fixtures/golden outputs for guardrails, hallucination checks, or citation correctness; no scoring harness beyond maxScore analytics (`src/components/pgpt-insights/...`).

## Duplications & Conflicts (spec/style/templates/rules/guardrails)
- Pricing/gunsmithing/competitor refusals duplicated across spec (`V2_REDO_assistant-spec.md:310-331,322-325`), style exemplars (`src/app/api/perazzi-assistant/route.ts:185-196`), and BLOCKED_RESPONSES (`:43-52`); wording varies (policy vs tone).
- Tone/length conflict: poetic, multi-paragraph exemplars (`:158-196`) vs final rule “short paragraphs…avoid filler” (`:1021-1025`) and `toneNudge` “concise” (`:832-834`).
- Archetype influence: spec says archetype guides tone but never facts (`V2_REDO_assistant-spec.md:226-233`), yet archetype block in prompt emphasizes tone guidance (`src/app/api/perazzi-assistant/route.ts:971-987`) while templates may include archetype-specific structures (`src/lib/perazzi-intents.ts:144-178`), increasing overlap.
- Retrieval instruction duplication: spec requires grounding and citations (`V2_REDO_assistant-spec.md:437-444`), while closing rules also ask for Markdown/bullets (`src/app/api/perazzi-assistant/route.ts:1021-1025`); no single concise guardrail block near the end.
- Late overrides: `toneNudge` appended last can supersede earlier tone/formatting; no late restatement of safety/grounding after templates/archetype/relatability blocks.

## Salience/History Dominance Risks
- Full-history resend + long assistant turns reduce salience of latest user intent; no clipping by role, so assistant “voice” may overpower fresh user needs.
- Context line precedes docSnippets/templates; latest user question is not restated anywhere except in history, so model may anchor on prior turns if retrieval brings unrelated bios/heritage.

## Cache-Busting Summary
- Everything dynamic sits inside the `instructions` string; only a small static prefix (spec/style) could be cached, but changing docSnippets/context/templates invalidate it. Cached tokens from Responses will rarely accumulate without restructuring prompt blocks.

## Candidate A/B Prompt Structures to Test (do not implement)
1. **Last-N user turns + slim assistant summary**: Send last 4 user messages + brief assistant summary instead of full 40-message history. Hypothesis: reduces inertia/self-echo; Risks: losing commitments/citations; ensure previous_response_id handles continuity.
2. **Modular prompt with static core + dynamic addenda**: Keep spec/guardrails as cached prefix; append only mode/archetype/template/docSnippets as dynamic blocks. Hypothesis: stabilizes guardrail salience; Risks: mis-ordered addenda could override safety if not repeated late.
3. **Retrieval formatting refactor**: Single “References” header with numbered snippets (`[1] content … (Source: path)`) and no per-snippet `Source:` repetition. Hypothesis: lowers authority leakage and token load; Risks: citations may become less clear if numbering drifts.
4. **Archetype optionality toggle**: Omit archetype guidance block when confidence low; rely on neutral tone plus mode templates. Hypothesis: less tone clutter and conflict with safety; Risks: tone drift when archetype actually matters.
5. **Late guardrail recap block**: Add concise safety/grounding recap immediately before `toneNudge`. Hypothesis: boosts rule-following salience; Risks: more tokens, potential tension with brevity/tone requirements.

## Checklist (required deliverables)
- [x] Call graph diagram (text) with file paths/functions.
- [x] Prompt block inventory with exact injection order + code excerpts referenced.
- [x] Conflict/duplication list across spec/style/templates/final rules/guardrails.
- [x] Retrieval contamination and formatting risks with code references.
- [x] History self-contamination risks with code references.
- [x] Cache-busting analysis detailing changing blocks.
- [x] Guardrail enforcement map and logging behavior with code references.
- [x] Evaluation harness status and gaps.
- [x] Candidate A/B prompt structure variants (no implementation).
