# Perazzi Concierge Assistant – Implementation Roadmap (v2)

This roadmap combines the original seven-phase plan with implementation suggestions discovered during repository review. Store this file as the evolving source of truth; update it as phases progress.

---

## Phase 1 — Assistant Spec: Define Brain, Boundaries, Voice

**Goal:** Precisely document what the assistant does, what it avoids, and how it speaks—before shipping code.

### Scope & Use Cases
- **Prospect mode:** Explain platforms (e.g., MX vs. High Tech), fitting approaches, and purchase flow guidance.
- **Owner mode:** Provide service, parts, maintenance, and support information.
- **Navigation:** Direct users to site sections (“Where do I…?”).

### Hard Boundaries
- Talks only about Perazzi, clay target disciplines, and existing site flows.
- No DIY gunsmithing instructions or legal advice.
- Deflects off-topic or disallowed requests.

### Voice Specification
- Quiet, confident, reverent about craft.
- Emotionally intelligent but concise—no hype.
- Grounded in verifiable Perazzi content; transparently declines when unsure.

### Deliverable
- A versioned Markdown spec (1–2 pages) stored in the repo (e.g., `docs/assistant-spec.md`). Include stakeholder sign-off (marketing, brand, legal) so prompt changes are traceable.

---

## Phase 2 — Knowledge Base (RAG Foundation)

**Goal:** Build a Perazzi-first knowledge source that can be refreshed as content changes.

### Content Inventory
- Site copy: heritage, craft, platform details, service, FAQs.
- Internal docs: brand bible, ethos, writing guidelines, proposals.
- Structured data: models, specs, dealers, service centers.

### Data Formatting & Metadata
- Normalize into 300–800 word chunks aligned with headings.
- Attach metadata: `type`, `model`, `language`, `audience`, `source_url`, `last_updated`.
- Add linting to avoid mid-sentence splits; warn if embeddings fall below expected norm.

### Embeddings & Storage
- Select a vector store (pgvector/Postgres, Pinecone, Qdrant, Supabase, etc.).
- Create a repeatable ingestion script that:
  1. Reads Markdown, Sanity content, and JSON feeds.
  2. Splits into validated chunks.
  3. Generates embeddings.
  4. Stores text, metadata, and vectors.

### Deliverable
- Automated ingestion pipeline plus populated vector DB that can be re-run on demand (with multilingual readiness via `language` tags).

---

## Phase 3 — Backend “Concierge API”

**Goal:** Provide a single backend entry point that handles retrieval, prompting, safety, and logging.

### API Route
- Implement `pages/api/perazzi-assistant` (Next.js).
- Input: user messages, page context (URL/model slug), optional user info (locale, auth state).
- Output: streamed or buffered answer text, plus metadata (e.g., citations, guardrail state).

### RAG Pipeline
1. Embed user query.
2. Retrieve top-N chunks filtered by language/model.
3. Construct prompt:
   - System: Phase 1 spec.
   - Context: retrieved chunks with source citations.
   - User message: question.
4. Call the model (decide upfront on streaming vs. non-streaming to set latency expectations and frontend needs).

### Guardrails & Safety Routing
- If retrieval confidence is low, provide graded fallbacks (request clarification, escalate to human, redirect to canonical page).
- Special handling for safety-sensitive topics (service modifications, legal issues, firearms misuse) that point to authorized channels.

### Observability & Logging
- Log question, retrieved doc IDs, similarity scores, prompt/response token counts, guardrail triggers, answer length, and user feedback (thumbs up/down).
- Ship logs to a dashboard (Datadog, OpenTelemetry, etc.) for monitoring latency and failures.

### Deliverable
- Working API endpoint callable via Postman/browser with streaming support (if chosen) and comprehensive logs.

---

## Phase 4 — Frontend Chat Widget

**Goal:** Deliver an elegant, Perazzi-branded chat experience tightly integrated into the site.

### Chat Launcher
- Floating “Ask Perazzi” / “Perazzi Concierge” button.
- Lazy-load widget bundle and model credentials only upon interaction to protect performance budgets.

### Chat Panel
- Sliding drawer or modal with conversation history, input box, and quick-start buttons:
  - “Help me choose a gun”
  - “I already own a Perazzi”
  - “Service & care”
- Ensure keyboard accessibility (ARIA roles, focus trap) and proper theming via scoped design tokens (color, spacing, motion).

### Streaming UX & Controls
- Display tokens as they arrive.
- Provide reset, copy, and feedback controls.
- Handle retries gracefully if backend streaming drops.

### Context Injection
- From product pages: pass `modelSlug` to the API.
- From service pages: `context="service"`.
- From heritage/craft: `context="heritage"`.

### Deliverable
- Fully functional widget wired to the API, visually cohesive with the Perazzi site and accessible.

---

## Phase 5 — Contextual Hooks & Site Integration

**Goal:** Make the assistant feel native, helpful, and context-aware.

### Contextual Triggers
- Product pages: “Questions about this platform?” CTA launches widget with pre-set model context.
- Service pages: “Ask about service & care.”
- Heritage: “Ask the workshop” CTA.

### Smart Defaults & Personalization
- If user is logged in with region/language, pre-filter retrieval accordingly.
- When injecting account context, show a privacy notice (e.g., “Using your saved MX8 info”) with an option to clear it.

### Link-backs & Analytics
- Encourage answers to cite relevant site pages (leveraging `source_url`).
- Fire analytics events when contextual triggers are used to measure engagement per entry point.

### Deliverable
- Assistant woven into discovery, purchase, and ownership flows, with instrumentation to monitor usage.

---

## Phase 6 — Human Handoff, Safety, Refinement

**Goal:** Ensure safe, brand-reliable interactions and establish a learning loop.

### Escalation Paths
- Provide gentle handoff messaging for edge cases (“This is better handled by the Perazzi team. Here’s how to contact us.”).
- Optional contact capture (name/email) with clear usage explanation; pre-fill for logged-in users to reduce friction.

### Safety Checks
- Enforce prompt rules: no harmful use, illegal behavior, or detailed modification instructions.
- Optionally pre-filter user questions to short-circuit obviously disallowed requests.
- Schedule periodic red-team exercises (prompt injections, jailbreak attempts, firearm misuse) and document mitigations.

### Analytics & Tuning
- Monthly reviews of common questions, “I don’t know” cases, downvoted answers.
- Use findings to update the knowledge base, tighten prompts, and add FAQs to the site.

### Deliverable
- Documented feedback loop, safety playbook, and escalation mechanisms that keep the assistant aligned over time.

---

## Phase 7 — Future Enhancements

### Owner Portal Integration
- Define a data-contract API so the concierge can request specific account fields (e.g., `lastServiceDate`) without tight coupling to portal schemas.
- Enable answers like “When was my last service?” or “What does X on my invoice mean?”

### Multi-language Rollout
- Add Italian (and other priority languages) to the knowledge base.
- Reuse existing `language` metadata to filter retrieval, ensuring tone parity across languages.

### Micro-assistants
- Create task-specific intents (fitting explainer, configurator coach, heritage docent).
- Treat them as prompt augmentations with targeted context filters; A/B test via quick-start buttons before fully productizing.

---

## Ongoing Practices
- **Testing:** Pair automated tests (prompt regression, ingestion validation) with human spot checks each phase.
- **Documentation:** Maintain a living playbook capturing prompt versions, chunking strategies, guardrail logic, and operational checklists.

