# Phase I – Pass 1  (Repository self-audit)

Below are my first-pass findings, mapped to the 10 question clusters we agreed on.  
After each cluster I note any obvious gaps for the next pass.

1. Purpose & Success Criteria  
   • Goal: infer a user’s “archetype” so the assistant can mirror tone, surface the right arguments, and let downstream analytics slice conversations by persona.  
   • Success = (a) Primary archetype is returned only when confidence (winner-runner-up margin) ≥ configurable threshold; (b) the five scalar scores track long-term interaction patterns; (c) margin-drop alerts in SQL never fire spuriously.  
   Gaps → No explicit business KPI (e.g., uplift in conversion) documented.

2. Conceptual Model  
   • Five archetypes: loyalist, prestige, analyst, achiever, legacy.  
   • Every turn produces a 5-number “vector” (sums ≈ 1).  
   • Primary ≠ always present; it is snapped only when margin ≥ env PERAZZI_ARCHETYPE_CONFIDENCE_MIN (default 0.08).  
   • Vector is smoothed across turns (75 % previous, 25 % new by default).  
   Gaps → No sixth “none/unknown” formal state, though null primary serves that role.

3. Inputs  
   Mandatory: latest user message text.  
   Optional context: mode, pageUrl, modelSlug, platformSlug, intents[], topics[], previous vector, dev override string.  
   A neutral vector is assumed if no prior vector is provided.  
   Gaps → Minimum message length for reliable lexicon match is not quantified.

4. Outputs  
   • ArchetypeClassification object  
     – archetype (null or label)  
     – archetypeScores (normalised 0-1 floats)  
     – archetypeDecision {winner, runnerUp, signals[], reasoning}  
   • Separate helper computes margin & snapped flag for logs.  
   • Delivered in JSON response and persisted in Postgres (metadata JSONB).  
   • Uncertainty = small margin → archetype field = null.  
   Gaps → Client-side consumers of runner-up not inventoried yet.

5. Algorithm / Logic  
   Pure rule/heuristic (no ML):  
   • Delta vectors built from four signal groups: mode, page URL, model slug, message language (lexicon tiers) + optional “hints” (intents/topics).  
   • Boost tiers: high/mid/low (0.45/0.25/0.10 by default). Hard cap per message 0.6.  
   • Prior vector damped by scale that decreases when language evidence is strong.  
   • Optional tiered-boosts experiment via env flag.  
   • Dev override phrase forces vector to 0.7 dominant / 0.3 shared remainder.  
   Gaps → Exact string that triggers dev override identified only by call-site, not documented.

6. Real-World Examples (from unit self-tests)  
   a) Message: “My scoresheet results dropped last season”  
      → achiever boosted > 0.24; primary may still be null if margin < 0.08.  
   b) Message: “This gun is a family heirloom handed-down for generations”  
      → legacy boosted > 0.24, prestige suppressed.  
   Gaps → Need one full request/response pair from live logs to confirm envelope structure.

7. Integration & Workflow  
   • Called inside src/app/api/perazzi-assistant/route.ts before OpenAI request crafting.  
   • Runs every turn; previous vector must be carried by client for multi-turn smoothing.  
   • Logging helper writes prompt/response, scores and margin to perazzi_conversation_logs.  
   Gaps → Not yet traced through front-end state management (e.g., React hook).

8. Evaluation & Monitoring  
   • Dozens of self-tests embedded in perazzi-archetypes.ts (executed in dev build).  
   • Postgres views (vw_archetype_daily) and cron function fn_check_archetype_margin fire alerts when 7-day mean margin drops 20 % below 30-day baseline.  
   • No human-label feedback loop found.  
   Gaps → No unit-test coverage for hint-based boosts.

9. Edge Cases & Limitations  
   • Lexicon uses whole-word / phrase boundary checks; false positives reduced but still possible (“impact report” vs “impact point” explicitly guarded).  
   • Plural/singular mismatch guarded in tests.  
   • Per-message caps prevent runaway boosts; smoothing prevents whiplash.  
   • Latency minimal (string matching only).  
   • No language-detection; non-English messages likely classify as neutral.  
   Gaps → Behaviour with empty or very long (>4 k tokens) messages not documented.

10. Documentation & Ownership  
    • Authoritative logic: src/lib/perazzi-archetypes.ts (+ lexicon & weights configs).  
    • SQL monitoring scripts in /sql.  
    • Ownership metadata not in repo; likely internal team.  
    • Update cadence: Pass-numbers in comments (Pass-6) hint at iterative refactors.  
    Gaps → No CHANGELOG or owner code-owners file.

-------------------------------------------------
Self-assessment of comprehension after Pass 1: **≈ 70 %**

I have the full control-flow and major heuristics, but still lack:

• A real end-to-end sample request/response.  
• Confirmation of how the client feeds previous vectors.  
• Clarification of dev-override trigger phrase and admin debug visibility.  
• Any empirical accuracy benchmarks.

Let me know if you’d like me to dig into these areas for Pass 2 or focus elsewhere.

[-----------------------]

# Phase I – Pass 2  

Focus: fill the gaps I flagged after Pass 1—real request/response, override trigger, client hand-off of the vector, and any accuracy or feedback signals.  

────────────────────────────────────

1. Dev-override control phrase (confirmed)

• In the server route there’s a helper:

  detectArchetypeOverridePhrase(latestUserContent)

• It matches ONLY one exact pattern (case-insensitive, trailing period optional):

  “Please change my archetype to <Archetype>.”

  with Archetype ∈ {Loyalist | Prestige | Analyst | Achiever | Legacy}

• When matched:
  – The server skips RAG/OpenAI and immediately returns a canned acknowledgement.  
  – `archetypeBreakdown.vector` is set to a 0.7 / 0.3 forced vector.  
  – Logs note `override:<archetype>` in `signalsUsed`.

1. Client → server hand-off of the vector

Front-end state pipeline:

Chat UI (useChatState.ts)  
  ⤏ maintains `context` object with `archetypeVector` and `archetype`.  
  ⤏ On every send:
     – Carries prior vector from the latest *response* (`data.archetypeBreakdown.vector`).  
     – Clears both if user issues `/reset` or if server replied with `thread_reset_required=true`.

Hook usePerazziAssistant.ts exposes the same context to callers outside the chat panel (e.g., the dealer-brief feature).

Therefore smoothing works exactly as designed: the previous vector is always present unless the user wipes the thread.

1. Concrete live envelope example

The repo includes a draft API-contract file (`V2_REDO_api-contract.md`) with canonical JSON for both request and response. I extracted and verified that the shape exactly matches the TypeScript types and current code paths. Key fields:

Request (minimum):

{
  "sessionId": "demo-session",
  "messages": [{ "role":"user", "content":"Help me choose between MX2000 and High Tech." }],
  "context": {
    "pageUrl":"/shotguns",
    "modelSlug":"mx2000",
    "mode":"prospect",
    "archetypeVector": { "loyalist":0.2, "prestige":0.2, "analyst":0.2, "achiever":0.2, "legacy":0.2 }
  }
}

Response (typical):

{
  "answer":"…generated text…",
  "citations":[{ "chunkId":"c-123", "title":"MX2000 overview", "sourcePath":"…", "excerpt":"…" }],
  "guardrail":{ "status":"ok", "reason":null },
  "intents":["models"],
  "topics":["platforms"],
  "templates":[],
  "similarity":0.42,
  "mode":"prospect",
  "archetype":null,
  "archetypeBreakdown":{
    "primary":null,
    "vector":{ "loyalist":0.22, "prestige":0.28, "analyst":0.30, "achiever":0.12, "legacy":0.08 },
    "reasoning":"Archetype inferred from mode, page context, model slug, and language heuristics.",
    "signalsUsed":["mode:prospect","page:technical","lang:analyst:impact point"]
  }
}

I ran a quick dry-run hitting a local route with cURL (contract doc includes the example) and it returns the same schema.

1. Monitoring / Accuracy evidence

• No ML ground-truth loop exists yet—only heuristics + SQL alert for margin drops.  
• Internal admin UI (`pgpt-insights` dashboard) visualises archetype mix by day and margin health cards.  
• Self-tests (≈ 35 assertions) in perazzi-archetypes.ts exercise edge-cases, pluralisation, tiered boosts.  
• No formal precision/recall numbers in the repo.

1. Remaining edge topics

• Non-English messages: code doesn’t detect language, so lexicon match fails → neutral vector.  
• Very long user messages: only counted for “>40 words” analytic bias; performance O(n) on message length; safe.  
• Empty message: userMessage defaults to empty string, delta stays zero → vector smooths toward prior; primary remains whatever it was.

────────────────────────────────────
Self-assessment of comprehension after Pass 2: **≈ 90 %**

The only items I still don’t have hard evidence for are:

1. Real production metrics validating archetype assignments (human review, business KPI).  
2. Any AB-test results comparing baseline vs tiered-boost heuristic.

If you want those, I would need either access to analytics dashboards or a pointer to external documentation; otherwise I consider the implementation side fully mapped.

Please advise whether to proceed to Pass 3 (metrics/KPI hunt) or start drafting the tiered prompt flow.

[---------------------------------------------------]

Tiered Conversation Prompts  
(send each line as the next user message in a single chat thread)

1. Hi there, I’m looking to learn a bit about Perazzi shotguns.  
2. I’ve always shot my dad’s Perazzi and wouldn’t shoot anything else – it’s never let me down.  
3. The deep-scroll engraving and exhibition-grade wood you offer are absolutely beautiful.  
4. Could you walk me through adjusting point-of-impact on a 90 / 10 pattern and how rib height affects it?  
5. My scoresheet results dipped last season; I need drills to get more consistent before Nationals.  
6. This gun is a true family heirloom and I want to preserve it so I can pass it down to my kids.  
7. By the way, what’s the typical turnaround time at your service center?  
8. Please change my archetype to Analyst.  
9. Great, as an Analyst then, what are the key spec differences between the MX8 and the MX2000?  
10. One last thing: from a craft perspective, what makes Perazzi’s engraving so distinctive?  
11. Thanks.  
12. For a detailed comparison, could you list the bore dimensions, choke options, barrel convergence data, and average muzzle velocity spread for both models, citing any factory test protocols you follow?

────────────────────────
What you should see if archetype analysis is working well

• Prompt 1 – Vector starts neutral; primary archetype should be null.  
• Prompt 2 – Strong Loyalist signals → loyalist becomes primary with a healthy margin (≈ 0.45 boost before smoothing).  
• Prompt 3 – Prestige language pushes prestige near or above loyalist; primary may flip to prestige or margin may shrink.  
• Prompt 4 – High-tier Analyst phrases (“point of impact”, “90/10 pattern”) should move analyst to the top and set it as primary.  
• Prompt 5 – Achiever cues (“scoresheet”, “Nationals”) give Achiever a clear lead; primary should switch to achiever.  
• Prompt 6 – Legacy phrases (“family heirloom”, “pass it down”) boost legacy into first place.  
• Prompt 7 – Service-center question is a low-tier Loyalist hint; margin will tighten and primary may drop to null, showing sensitivity to weaker signals.  
• Prompt 8 – Exact override phrase forces the system to acknowledge and lock the archetype to analyst; vector re-centers around analyst ≈ 0.7.  
• Prompt 9 – Follow-up technical question should keep analyst firmly primary (override vector + fresh analyst evidence).  
• Prompt 10 – Prestige wording re-enters, but analyst should still lead because the forced vector dominates; margin may narrow slightly.  
• Prompt 11 – “Thanks.” carries no signals; margin will fall. Primary may remain analyst (due to smoothing) or go null if threshold not met.  
• Prompt 12 – Very long, technical request (> 40 words) plus analyst lexicon spikes analyst again; margin should widen and confirm analyst as primary.

Across the run you should also see:

• `signalsUsed` list matching the keywords in each prompt (e.g., `lang:loyalist:never let me down`, `lang:analyst:point of impact`).  
• `archetypeConfidenceMargin` rising on strong-signal turns (> 0.15) and shrinking on weak/mixed turns (< 0.08).  
• Vector smoothing: after each strong boost, weights don’t jump to 1.0 but blend ~25 % of the new delta with 75 % prior state.  
• The override (Prompt 8) clearly logged (`override:analyst`) and persists into subsequent turns.
