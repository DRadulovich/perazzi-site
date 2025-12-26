# PerazziGPT v2 Archetype Analysis Roadmap

This roadmap outlines a clear path to evolve PerazziGPT v2 from its current manual archetype override and static hints into a fully profiled, adaptive archetype system. The goal is to create an assistant that understands and adapts to user preferences and context in a nuanced way, while maintaining Perazzi’s voice, safety guardrails, and user control.

---

## Current State

- The API response includes `mode` and `archetype` fields.
- Archetype is manually overridden via a specific phrase or static hints.
- No real-time profiling or adaptive behavior based on user interaction or context.
- Archetype affects framing and tone but never changes facts or safety guardrails.

---

## Phase A: Signal Design

### Conceptual Changes
- Identify the signals that can hint at a user’s archetype.
- Define the archetype space clearly (e.g., Loyalist, Prestige, Analyst, Achiever, Legacy).
- Determine how signals will be captured and processed.

### Signals to Use
- Language patterns in user queries (word choice, sentiment, formality).
- Contextual metadata such as `pageUrl` and `modelSlug`.
- User actions like repeated queries, time spent on certain pages, or interaction sequences.

### Scoring Representation
- Begin with a simple vector representing weights for each archetype, e.g., `[Loyalist, Prestige, Analyst, Achiever, Legacy]`.
- Initialize scores with neutral or uniform values.

### Updates Over Time
- Scores will start static but are designed to be updated with new signals as they arrive.
- No real-time update yet; focus on defining signal capture and initial scoring.

### Safety & User Control
- Archetype remains purely a framing device.
- Manual override phrases continue to take precedence.
- No changes to facts or guardrails.

---

## Phase B: Initial Scoring & Smoothing

### Conceptual Changes
- Implement initial scoring logic that updates archetype weights based on signals.
- Introduce smoothing to avoid abrupt changes in archetype on a single message.

### Signals to Use
- Refine language pattern analysis (e.g., keywords, sentence structure).
- Start incorporating session-level context such as recent queries.

### Scoring Representation
- Use weighted averages or exponential smoothing to update archetype scores.
- Prevent “whiplash” by limiting how much scores can change between messages.

### Updates Over Time
- Scores update progressively with each user interaction.
- Scores decay or stabilize over time to reflect consistent user behavior.

### Safety & User Control
- Ensure archetype updates do not affect factual accuracy or safety constraints.
- Manual overrides still respected and can reset or freeze scores.

---

## Phase C: Session-Level Memory

### Conceptual Changes
- Maintain archetype scores throughout a session to personalize responses.
- Use session history to inform archetype updates more robustly.

### Signals to Use
- Full session transcript and interaction history.
- User navigation paths and dwell times.

### Scoring Representation
- Session-level archetype vector updated in-memory or via session storage.
- Use session summaries or embeddings to refine scoring.

### Updates Over Time
- Scores persist and evolve during a session.
- Optionally, allow users to reset session archetype at any time.

### Safety & User Control
- Session archetype remains a soft influence on tone and framing.
- Clear UI affordances for users to override or reset.

---

## Phase D: Persistent Profiles

### Conceptual Changes
- Store archetype profiles persistently across sessions for returning users.
- Profiles evolve slowly over time to reflect long-term preferences.

### Signals to Use
- Aggregate signals from multiple sessions.
- Incorporate explicit user feedback where available.

### Scoring Representation
- Persistent archetype vectors saved in user profiles or cookies.
- Blend new session data with historical data using weighted updates.

### Updates Over Time
- Slow adaptation to long-term user behavior.
- Mechanisms to prevent stale or outdated profiles from dominating.

### Safety & User Control
- Persistent profiles respect manual overrides and user opt-out.
- Users can reset or delete their profiles.

---

## Phase E: Integration into Retrieval & Voice

### Conceptual Changes
- Use archetype profiles to influence retrieval of examples, explanations, and CTAs.
- Adapt voice and phrasing dynamically based on archetype weights.

### Signals to Use
- Archetype profile combined with current query context.
- Possibly integrate with other personalization signals.

### Scoring Representation
- Archetype weights inform retrieval ranking or prompt templates.
- Voice modulation parameters adjusted per archetype.

### Updates Over Time
- Continuous feedback loop between archetype and content delivery.
- Monitor impact on user satisfaction and adjust accordingly.

### Safety & User Control
- Maintain strict guardrails to prevent archetype from changing facts or safety.
- Allow users to disable adaptive voice features if desired.

---

## Phase F: UI & Controls

### Conceptual Changes
- Expose archetype information and controls in the UI.
- Provide users with transparency and control over profiling.

### Signals to Use
- Display current archetype scores or dominant archetype.
- Offer manual override, reset, and opt-out options.

### Scoring Representation
- Visualize archetype vector or summary archetype.
- Allow user input to adjust or confirm archetype.

### Updates Over Time
- UI controls update profiling logic in real-time.
- Provide feedback to users about archetype changes and effects.

### Safety & User Control
- Emphasize user empowerment and privacy.
- Ensure all controls are clear, accessible, and reversible.

---

## Final Vision

PerazziGPT evolves into a smart assistant that gradually learns what matters most to each user—whether it’s heritage, performance, exclusivity, progress, or legacy. It subtly shapes explanations, examples, and calls to action to resonate with these values, creating a personalized experience that feels authentic and engaging. Throughout, the assistant remains firmly grounded in Perazzi’s voice and uncompromising safety guardrails, never sacrificing accuracy or integrity for personalization. Users always retain control, with transparent options to guide or reset their profile.

---

## Where to Implement

- **Profiling Logic:** Implement signal processing, scoring, smoothing, and profile persistence in the API route or create a dedicated helper module under `src/lib/`.
- **Data Representation:** Extend request and response types to include archetype vectors, scores, and override flags.
- **UI Exposure:** Integrate archetype display, controls, and override options in `usePerazziAssistant` and `ChatPanel.tsx` to provide seamless user interaction with profiling features.

---

This roadmap provides a structured, phased approach to building a robust, adaptive archetype system that enhances PerazziGPT’s personalization while safeguarding user control and safety.
