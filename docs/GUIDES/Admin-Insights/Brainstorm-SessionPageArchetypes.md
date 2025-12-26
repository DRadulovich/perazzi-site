Here’s what you’d add to make “archetype % breakdown per interaction” real and useful:

### 1) Log the full archetype distribution per message

Right now you store `archetype: string | null`. You’d also store something like:

* `metadata.archetypeScores` (JSON)
  Example shape:

  ```json
  {
    "Loyalist": 0.12,
    "Prestige": 0.08,
    "Analyst": 0.46,
    "Achiever": 0.22,
    "Legacy": 0.12
  }
  ```

Optionally also:

* `metadata.archetypeDecision` (why the winner won: top features/signals)
* `metadata.archetypeConfidence` (e.g., top1 - top2 margin)

This is the “source of truth” that makes the UI possible.

### 2) Display it where it matters: the row + the inspector

With the refactor:

* **In the Logs table (scan mode):** show the *winner archetype* plus a tiny “margin” or “confidence” hint (e.g. `Analyst · +24pp`).
* **In the inspector/drawer (inspect mode):** show the full breakdown as:

  * a stacked mini bar (5 segments)
  * exact percentages
  * “winner + runner-up” callout

That gives you message-to-message visibility without turning the table into soup.

### 3) Make “adaptation over time” visible in Session view

To see how the model is *shifting* within a conversation, the killer feature is:

* Session timeline with one row per message
* A stacked bar per message (the 5 archetype percentages)
* Optionally a smoothed “rolling” archetype state (if you have a running profile)

This turns archetype behavior into a readable story instead of a pile of labels.

### 4) Filters that become surgical

Once you have distributions, you can filter for:

* “messages where Analyst > 0.40”
* “messages where winner changed from previous turn”
* “low-confidence archetype decisions” (top1-top2 margin below X)

Those filters are *huge* for QA and prompt/guardrail tuning.

---

### One subtle point (but important)

If you want to monitor how the model is “interpreting and adapting,” you may actually want **two related distributions** per message:

1. **Instant classification** (based on the current user message)
2. **Session profile state** (running estimate that updates over time)

Sometimes the “right” behavior is: current message looks Prestige-y, but the *user* is still predominantly Analyst. Tracking both gives you a real window into adaptation.

---