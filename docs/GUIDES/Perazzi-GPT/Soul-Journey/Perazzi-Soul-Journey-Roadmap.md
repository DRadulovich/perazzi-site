# Perazzi “Soul Journey” – Implementation Roadmap

This roadmap covers the path from the current cinematic build-journey page to the full interactive “your gun’s soul” experience with the hidden Step 12 reveal.

It’s organized in phases so we can ship in layers and not get lost in experiments.

---

## 0. Current State (Baseline)

**Already in place on `/the-build/why-a-perazzi-has-a-soul`:**

- Hero section with cinematic full-bleed image and on-brand typography.
- 11-step build journey powered by Sanity `article` documents:
  - Sticky left-rail (“Build journey”) with scroll-aware highlighting.
  - Each step as a full-viewport gradient section (black + Perazzi black).
  - For each step:
    - Title, excerpt, hero image, and body rendered in a matte card.
- Between each article step:
  - Fullscreen parallax transition using the *previous* step’s hero image.
  - Centered “Up next” label + italic excerpt for the *next* step.

This doc describes what comes next to turn this into an **interactive soul journey** ending in a personalized Step 12.

---

## 1. Narrative & Content Design

**Goal:** Finalize the *story and questions* before wiring up heavy interactivity.

### 1.1. Vignette audit

- [ ] Re-read all 11 article vignettes as a single story.
- [ ] Ensure:
  - POV is consistently from the artisan’s eyes.
  - No explicit owner names / gun identifiers yet.
  - Each vignette feels slightly *unfinished* or open-ended.
- [ ] Note where each vignette naturally invites a question to the reader.

### 1.2. Soul questions per step

For each of the 11 steps:

- [ ] Write one **soul question** that:
  - Ties directly to what happens at that station.
  - Invites introspection, not “quiz” answers.
  - Tells us something that could shape *their* gun (fit, feeling, aesthetics, intent, etc.).
- [ ] Store these questions in a doc or table first (step number → question).

### 1.3. Assistant voice & prompt templates

- [ ] Decide on the **assistant persona** (master artisan) in concrete terms:
  - Tone (calm, observant, lightly poetic, grounded in craft).
  - Constraints (no pricing, no promises about production timelines, etc.).
- [ ] Draft a **base prompt template** for the artisan response for each step, e.g.:

  > “You are the Perazzi master craftsman narrating the build of a single bespoke shotgun for one client. You speak in first person as the artisan. This vignette is for station [X: {step title}]. You receive the shooter’s reflection below. Write a short passage (1–3 paragraphs) describing what you did at this station to make *their* gun perfect, incorporating their feelings and preferences. Match the tone of the existing build-journey articles. Avoid directly repeating their exact words; instead, reinterpret them through your eyes as the craftsman.”

- [ ] Optionally, define **step-specific prompt variants** (if certain stations need special instructions).

Deliverable: **Narrative + Q doc** (steps 1–11 + questions + prompt templates).

---

## 2. Sanity Schema Updates

**Goal:** Add soul-question fields to the `article` documents used for the journey.

### 2.1. Schema fields

In the `article` schema (or a dedicated journey-related schema extension):

- [ ] Add:

  ```ts
  defineField({
    name: "soulQuestion",
    title: "Soul Question",
    type: "text",
    rows: 3,
    description:
      "Reflection question shown after this step in the build journey (for the personalized Step 12).",
  });
  ```

- [ ] Optionally add:

  ```ts
  defineField({
    name: "soulPromptKey",
    title: "Soul Prompt Key",
    type: "string",
    description:
      "Optional key to select a specific prompt template for this step.",
  });
  ```

### 2.2. Studio input

- [ ] Populate `soulQuestion` for each of the 11 relevant step-articles in Sanity Studio.
- [ ] (Optional) Populate `soulPromptKey` if needed.

Deliverable: **Sanity Studio** shows soul questions on each journey article, and the build still compiles.

---

## 3. Data Fetching & Types

**Goal:** Make sure the journey page has access to `soulQuestion` (and `soulPromptKey` if used).

### 3.1. GROQ query

- [ ] Update `BUILD_JOURNEY_QUERY` to include:

  ```groq
  soulQuestion,
  soulPromptKey,
  ```

### 3.2. Type updates

- [ ] Update `BuildJourneyArticle` TypeScript type to include:

  ```ts
  soulQuestion?: string;
  soulPromptKey?: string;
  ```

- [ ] Verify TypeScript passes without errors.

Deliverable: `stations` array on the journey page includes soul-question data.

---

## 4. Split into Server + Client Components

**Goal:** Keep Sanity/data work on the server, and move interactive logic (questions + AI calls + Step 12 reveal) into a client component.

### 4.1. Server component: data + shell

- [ ] Refactor `BuildJourneyPage` to:

  - Fetch `stations` (current behavior).
  - Render:

    ```tsx
    <main className="bg-canvas text-ink">
      <HeroSection />
      <BuildJourneyClient stations={stations} />
      {/* (Optional) remove inline script once scroll spy lives in client */}
    </main>
    ```

### 4.2. New client component

- [ ] Create `BuildJourneyClient` as a `"use client"` component:

  ```tsx
  "use client";

  function BuildJourneyClient({ stations }: { stations: BuildJourneyArticle[] }) {
    // state + handlers here
    return <JourneyChaptersInteractive stations={stations} />;
  }
  ```

- [ ] Move the scroll spy logic (IntersectionObserver) into this client component later, so all window/document usage lives on the client side.

Deliverable: Page still renders exactly as before, but with a client “island” wrapper ready for interactivity.

---

## 5. Question UI & Local State

**Goal:** Add a reflection question + answer input after each of the 11 steps, and manage that state client-side.

### 5.1. State shape

In `BuildJourneyClient` or `JourneyChaptersInteractive`:

- [ ] Define:

  ```ts
  type StepKey = string; // e.g. "01", "02", ...

  const [answers, setAnswers] = useState<Record<StepKey, string>>({});
  const [artisanParagraphs, setArtisanParagraphs] = useState<Record<StepKey, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<StepKey, boolean>>({});
  ```

- [ ] Optionally: read/write this state to `localStorage` for persistence.

### 5.2. Question UI per step

- [ ] After each article’s main card content, render:

  - A “Reflection” label.
  - The `soulQuestion` text.
  - A textarea + submit button bound to that step key.

- [ ] On submit:

  - Prevent default.
  - Store the answer in `answers[stepKey]`.
  - Call an API (Phase 6) to get the artisan paragraph.
  - Show minimal loading UX (disable button, maybe show small “Crafting your response…” text).

Deliverable: Users can type and submit answers per step; state is stored in memory (even before AI wiring).

---

## 6. Assistant Integration (API Endpoint)

**Goal:** Connect each submitted answer to the embedded artisan assistant, and store the returned paragraphs for Step 12.

### 6.1. API route

- [ ] Create a Next.js route, e.g. `/api/soul-journey-step`:

  - Input JSON:

    ```jsonc
    {
      "step": "01",
      "title": "Action & Receiver Machining",
      "soulQuestion": "...",
      "userAnswer": "...",
      "soulPromptKey": "optional-key"
    }
    ```

  - In the route handler:

    - Validate input.
    - Construct the full prompt (using base template + step-specific context).
    - Call the existing assistant infrastructure (or direct OpenAI API) with that prompt.
    - Return `{ paragraph: "..." }`.

### 6.2. Frontend integration

- [ ] In the submit handler:

  - Call `fetch("/api/soul-journey-step", { method: "POST", body: JSON.stringify(payload) })`.
  - Parse the JSON response.
  - Save `paragraph` into `artisanParagraphs[stepKey]`.
  - Mark `isSubmitting[stepKey] = false` when done.

### 6.3. Error handling

- [ ] Display a small, gentle error message if the API fails.
- [ ] Allow the user to retry without losing their typed answer.

Deliverable: Submitting a reflection answer produces a stored artisan paragraph per step.

---

## 7. Step 12 Reveal Logic & Layout

**Goal:** Build the dynamic Step 12 section and gate it until all steps have generated artisan paragraphs.

### 7.1. Completion condition

- [ ] Compute `allComplete` on the client:

  ```ts
  const totalSteps = 11;
  const completedSteps = Object.keys(artisanParagraphs).length;
  const allComplete = completedSteps >= totalSteps;
  ```

- [ ] Consider only counting steps where `artisanParagraphs[stepKey]` is non-empty.

### 7.2. Step 12 section layout

- [ ] Add a final section at the end of `JourneyChaptersInteractive`:

  - Title: “Step 12” + “The Soul of Your Gun” (or equivalent).
  - Body: a series of paragraphs composed from `artisanParagraphs` in step order.

- [ ] While `allComplete === false`:

  - Apply a blur + pointer-events-none to the body text container.
  - Show a clear instruction like:

    > “Finish reading and answering each question in order to view the last step.”

- [ ] When `allComplete === true`:

  - Remove the blur and pointer-events-none classes.
  - Consider a gentle fade-in or subtle transition.

Deliverable: Step 12 appears at the end of the page and unlocks once all artisan responses are generated.

---

## 8. Persistence & Identity (Optional but Recommended)

**Goal:** Allow users to return and still see their personalized Step 12, not lose everything on refresh.

### 8.1. Minimal persistence

- [ ] Use `localStorage` keyed to this page, e.g. `perazziSoulJourney_v1`:

  - Save `answers` and `artisanParagraphs` on changes.
  - On mount, load them and rehydrate state.

### 8.2. Account-based persistence (future)

If/when user accounts are integrated more tightly:

- [ ] Introduce a backend model (e.g. Supabase or custom DB) to store:

  ```ts
  {
    userId,
    journeyId: "perazzi-build-soul-v1",
    answers,
    artisanParagraphs,
    completedAt?: Date
  }
  ```

- [ ] Load this on page load when the user is authenticated.

Deliverable: At minimum, answering all questions and refreshing the page does **not** lose progress locally.

---

## 9. Telemetry & Experience Tuning

**Goal:** Make sure this whole thing is actually being used, and see where users drop off.

- [ ] Add analytics events for:
  - Step viewed (Step 01–11, Step 12 unlocked).
  - Reflection answered (step + length, not content).
  - API success/error per step.
- [ ] Track funnel:
  - How many users reach Step 03? Step 07? Submit all 11? Unlock Step 12?

Deliverable: Ability to see engagement patterns and iterate on questions, prompts, and pacing.

---

## 10. Visual & Interaction Polish

**Goal:** Make the experience feel whisper-smooth and intentional.

- [ ] Fine-tune spacing and breakpoints for:
  - Reflection blocks under each step.
  - Step 12 layout on mobile vs desktop.
- [ ] Add subtle motion:
  - Fade-in of reflection UI as user finishes each article.
  - Soft reveal animation when Step 12 unlocks.
- [ ] Confirm dark-mode contrast and readability on:
  - Gradient sections.
  - Parallax transitions.
  - Step 12 body text.

Deliverable: The page feels like a single, continuous journey—not a stack of bolted-on widgets.

---

## 11. Future Enhancements (Nice-to-Haves)

These are intentionally *later* so they don’t distract from shipping the core loop:

- [ ] Let users download/export their Step 12 as a PDF “Letter from the Artisan.”
- [ ] Email follow-up that includes the final Step 12 text.
- [ ] Optionally save this into a CRM/owner record as part of a future “Perazzi Passport.”
- [ ] A subtle visual “thread” that calls back to Step 12 on other parts of the site (e.g. in an owner’s dashboard).

---

## Summary

The core journey to MVP:

1. **Finalize story, soul questions, and prompt strategy.**
2. **Add `soulQuestion` fields to Sanity and include them in the journey query.**
3. **Refactor the page into a server + client architecture.**
4. **Add reflection UI and local state per step.**
5. **Integrate the artisan assistant via an API endpoint.**
6. **Build and gate Step 12, composing all artisan paragraphs.**
7. **Add persistence, analytics, and polish.**

Once those are done, users won’t just *read* about how a Perazzi gets its soul—they’ll walk away holding a story that convinces them their gun already has one, and it was built around them from the start.
