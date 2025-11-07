# Service & Parts – Genuine Parts & Upgrades

## E. Genuine Parts & Upgrades *(new; narrative—no e‑commerce)*
**Purpose:** Clarify **genuine parts only**; fitment by authorized hands. Explain what is reasonable to request (springs, pins, pads, chokes) vs. factory‑fit items (trigger groups, barrels).

**Fields:**  
- **Editorial rationale:** metallurgy, tolerances, safety.  
- **Sample parts list (non‑priced):** `[{ name, purpose, fitment: "factory"|"authorized"|"user", notesHtml }]`  
- **CTA:** “Request Parts/Upgrade Advice” → parts request route.

**States & Interaction:**  
- Optional per‑item “Learn more” toggles (Radix Collapsible) to reveal notes; list remains accessible as plain text if JS off.

**Motion/Perf/A11y:**  
- Minimal fades; reduced‑motion instant.  
- Fitment tag is text (not color alone); proper ARIA on collapsibles; logical tab order.
