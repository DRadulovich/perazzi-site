# Perazzi Soul Journey – System Map

> High-level overview of how the Perazzi “Soul Journey” experience fits into the existing PerazziGPT v2, Sanity, and front-end stack.

The Soul Journey is an 11-step artisan-perspective build story on `/the-build/why-a-perazzi-has-a-soul`. Each step is a Sanity article flagged for the journey, includes a soulQuestion for reflection, and will eventually feed a personalized Step 12 reveal (artisan letters generated from user answers). This map helps both humans and AI see where the content lives, how it is rendered, and where PerazziGPT v2 infrastructure will plug in.

---

## High-Level Concept

- 11-step build narrative told from the artisan’s POV; each step is a Sanity `article`.
- Each step carries a `soulQuestion` that invites user reflection aligned to that station’s craft moment.
- Future plan: collect answers, generate artisan letters per step, and unlock a personalized Step 12.
- Integration intent: reuse PerazziGPT v2 voice/guardrails/archetypes; likely add a dedicated API endpoint to generate “artisan responses” driven by the step’s prompt template and the user’s answer.

---

## Content & Schema

- **Sanity article schema** (`sanity/schemas/article.ts`):
  - Journey flags: `isBuildJourneyStep` (bool), `buildStepOrder` (number).
  - Reflection: `soulQuestion` (text).
  - Core article fields used on the page: `title`, `slug`, `excerpt`, `body`, `heroImage`.
- **Source of questions**: `docs/GUIDES/Soul-Questions-and-Prompts.md`
  - Sections `## 01 – …` through `## 11 – …` each include `### SoulQuestion` and `### ArtisanPromptTemplate`.
  - Migration script populated `soulQuestion` into the matching `article` documents.
- **Selection & ordering**:
  - `BUILD_JOURNEY_QUERY` filters `*[_type == "article" && isBuildJourneyStep == true] | order(buildStepOrder asc, title asc)` and pulls `title`, `slug`, `excerpt`, `body`, `heroImage`, `buildStepOrder`, `soulQuestion`.

---

## Front-End Journey Implementation

- **Page route**: `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx`
  - Server component fetches journey articles via `BUILD_JOURNEY_QUERY`.
  - Renders `HeroSection` (full-bleed image + intro).
  - Invokes client wrapper `BuildJourneyClient` for interactive UI.
  - Leaves an inline scroll-spy script (IntersectionObserver) for the left-rail highlight.
- **Client layer**: `src/app/(site)/the-build/why-a-perazzi-has-a-soul/BuildJourneyClient.tsx`
  - `"use client"` island; holds local state for per-step answers, stub “artisan responses,” and submitting flags.
  - Components inside:
    - `JourneyProgress`: sticky left rail, ordered step links.
    - `JourneyChapters`: renders each step section + transitions.
  - Per-step layout:
    - Full-viewport gradient section (`bg-black` with top/bottom fades).
    - Card with title, excerpt, hero image, body (`PortableBody`), and Reflection block.
    - Transition section between steps: parallax background using previous hero image + “Up next” excerpt of the next step.
- **Reflection block (current state)**:
  - Shows “Reflection” label and `soulQuestion`.
  - Textarea + “Send to the artisan” button (stub only; no API).
  - On submit: stores the user’s answer locally as the stub “artisan response”; shows “Saved to your final step.”

---

## PerazziGPT v2 Assistant Stack (Relevant Pieces)

Use `docs/GUIDES/V2_PGPT_file-map.md` as the broader index; key files for Soul Journey integration:

- **Specs & behavior (brand/voice/guardrails)**: see V2 docs under `V2-PGPT/.../V2_REDO_*` for assistant spec, guardrails, voice calibration, archetypes, and use-case depth.
- **Retrieval & archetypes**:
  - `src/lib/perazzi-retrieval.ts` — embeddings + Supabase chunk lookup for v2 corpus.
  - `src/lib/perazzi-archetypes.ts` — computes archetype breakdowns and guidance vectors.
- **Assistant API**:
  - `src/app/api/perazzi-assistant/route.ts` — orchestrates retrieval + archetype + GPT completion; applies guardrails; returns answer with citations/meta.
  - Types: `src/types/perazzi-assistant.ts` — request/response, chunks, archetypes, modes.
- **Front-end assistant use**:
  - Hook: `src/hooks/usePerazziAssistant.ts` — chat state and API calls to `/api/perazzi-assistant`.
  - UI: `src/components/chat/ChatPanel.tsx` — on-site chat surface; sends user prompts to the assistant.
  - Shell: `src/components/concierge/ConciergePageShell.tsx` — hosts the assistant, manages context/mode.
- **Flow summary**:
  - UI (ChatPanel/usePerazziAssistant) → `/api/perazzi-assistant` → retrieval + archetypes → GPT completion → response with citations/meta → UI renders.
  - Why it matters: the same voice/guardrail stack is the likely foundation for generating per-step artisan letters in the Soul Journey.

---

## Integration Points for Soul Journey

- **Per-step AI generation (future)**:
  - Add a dedicated API (e.g., `/api/soul-journey-step`) that accepts: step id/slug, soulQuestion, user answer, and the step’s ArtisanPromptTemplate from `docs/GUIDES/Soul-Questions-and-Prompts.md`.
  - Use PerazziGPT v2 guardrails/voice; optionally reuse retrieval/archetype context if needed for tone.
  - Return a short artisan letter paragraph; store client-side initially, later persist server-side.
- **Step 12 reveal (future)**:
  - Final section on the journey page that unlocks after all steps have an artisan response.
  - Composes collected artisan paragraphs; starts blurred/locked until complete.
- **State management (current vs. future)**:
  - Current: `BuildJourneyClient` holds `answers`, `artisanParagraphs`, `isSubmitting` (local only).
  - Future: add persistence (localStorage or user profile/DB), track completion, and hydrate Step 12.
- **Scroll spy / client behavior**:
  - Inline IntersectionObserver script remains in `page.tsx`; could be migrated into `BuildJourneyClient` to keep all DOM usage client-side.
- **Schema/content ownership**:
  - Questions live in `Soul-Questions-and-Prompts.md` and are ingested into `article.soulQuestion`.
  - Journey selection driven by `isBuildJourneyStep` + `buildStepOrder`; hero/excerpt/body in the article drive the page visuals and transitions.

---

## Quick File Index (touchpoints)

- Content/questions: `docs/GUIDES/Soul-Questions-and-Prompts.md`
- Roadmap/design intent: `docs/GUIDES/Perazzi-Soul-Journey-Roadmap.md`
- Journey page (server shell): `src/app/(site)/the-build/why-a-perazzi-has-a-soul/page.tsx`
- Journey client & layout: `src/app/(site)/the-build/why-a-perazzi-has-a-soul/BuildJourneyClient.tsx`
- Schema: `sanity/schemas/article.ts` (`isBuildJourneyStep`, `buildStepOrder`, `soulQuestion`, hero, body, excerpt)
- Assistant stack (for future integration):
  - Retrieval: `src/lib/perazzi-retrieval.ts`
  - Archetypes: `src/lib/perazzi-archetypes.ts`
  - API: `src/app/api/perazzi-assistant/route.ts`
  - Types: `src/types/perazzi-assistant.ts`
  - Client hook/UI: `src/hooks/usePerazziAssistant.ts`, `src/components/chat/ChatPanel.tsx`, `src/components/concierge/ConciergePageShell.tsx`

Use this map as the launchpad for wiring per-step AI letters and the Step 12 reveal without re-reading the entire codebase. 
