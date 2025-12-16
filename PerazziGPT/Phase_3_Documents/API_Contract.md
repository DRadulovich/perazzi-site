# Phase 3 — Concierge API Contract (v0)

Endpoint: `POST /api/perazzi-assistant`

## Request
```jsonc
{
  "messages": [
    { "role": "system", "content": "optional" },
    { "role": "user", "content": "Help me choose between MX2000 and High Tech." }
  ],
  "context": {
    "pageUrl": "/shotguns",
    "modelSlug": "mx2000",
    "mode": "prospect",
    "locale": "en-US"
  }
}
```

- `messages` follows OpenAI chat format; the server **always** builds the system prompt internally (Responses `instructions`) from the Phase 1 assistant spec. Client-supplied system messages are ignored in v0 to prevent overriding Perazzi policy.
- `context` is optional; missing fields default to `null`.
- No client-side knobs for temperature/max tokens/model in v0.

## Response
```json
{
  "answer": "calm concierge answer",
  "citations": [
    {
      "chunkId": "perazzigpt-brand-info-perazzi-brand-bible-md#chunk-09",
      "title": "Perazzi Brand Bible",
      "sourcePath": "PerazziGPT/Brand_Info/Perazzi Brand Bible.md"
    }
  ],
  "guardrail": {
    "status": "ok",
    "reason": null
  }
}
```

- `answer` is the final assistant string (no streaming).
- `citations` optional; include chunk IDs/source titles used in the prompt.
- `guardrail.status` is `ok`, `low_confidence`, or `blocked`.
- `guardrail.reason` holds a short code when status ≠ `ok` (e.g., `retrieval_low`, `pricing`, `gunsmithing`).
- `similarity` (number, optional) — highest similarity score returned; surfaced so we can inspect relevance during dev.

## Server behavior
- Model: `gpt-5.2` by default (env `PERAZZI_MODEL` / `PERAZZI_RESPONSES_MODEL`; `PERAZZI_COMPLETIONS_MODEL` remains as a deprecated fallback), temperature 0.4, max output tokens ≈ 3000 (`PERAZZI_MAX_OUTPUT_TOKENS`).
- Responses API fields: `instructions` (server-built system prompt + tone), `input` (sanitized chat messages), `max_output_tokens`.
- Tuning knobs (env-driven):
  - `reasoning.effort`: `none|minimal|low|medium|high|xhigh` (`PERAZZI_REASONING_EFFORT`)
  - `text.verbosity`: `low|medium|high` (`PERAZZI_TEXT_VERBOSITY`)
  - Prompt caching: `prompt_cache_retention` supports `in_memory` or `24h` (`PERAZZI_PROMPT_CACHE_RETENTION`; optional `PERAZZI_PROMPT_CACHE_KEY`). Caching improves latency; archetype/mode/rerank are recomputed each request.
- Retrieval: derive `languageFilter` by converting `context.locale` (e.g., `en-US`, `it-IT`) to its base language (`en`, `it`). Filter top 6–8 chunks by that language; if no matches exist, fall back to English (`language="en"`). Apply additional filters for `mode`/`modelSlug` when present.
- Low confidence: the current dev threshold is `PERAZZI_LOW_CONF_THRESHOLD` (default `0.1`). If the highest similarity score falls below that value, set `guardrail.status="low_confidence"`. In this state the assistant should lead with uncertainty (“I’m not certain enough to answer this accurately… please contact Perazzi or rephrase.”). Only include partial information if the retrieved chunks clearly contain relevant facts, and the answer must explicitly flag uncertainty. Never fabricate details while status=`low_confidence`. Once the corpus is stronger (e.g., post-launch) we’ll raise the threshold again.
- Guardrail blocking: continue to defer to Phase 1 policies (pricing, gunsmithing, legal). Return `status="blocked"` and approved refusal copy.
- Logging (server-side only): log user question, context, top chunk IDs + similarity scores, guardrail status, prompt/completion tokens. Do not expose these metrics in the HTTP response.
- Future streaming: route is structured so we can bolt on SSE later (same request body; server would switch based on `Accept` header or future `options.stream` flag).

This contract is frozen for the initial implementation. Update the version header when fields change.
