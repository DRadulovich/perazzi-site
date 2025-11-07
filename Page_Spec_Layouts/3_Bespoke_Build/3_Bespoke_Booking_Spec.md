files["3_Bespoke_Booking_Spec.md"] = textwrap.dedent("""\
# Bespoke Build – Booking & What to Expect

## E. Booking & What to Expect *(new; composite of `CTASection` + `EditorialBlock`)*

**Purpose:** Translate intent into action with clarity; reduce friction/anxiety and maintain the invitation-led tone.

**Fields:**
- **Headline:** “Reserve Your Fitting”  
- **Options (cards):**  
  - *On‑site Factory Fit* — `durationMins`, short description, `href` CTA  
  - *Traveling Roadshow* — `durationMins`, short description, `href` CTA  
  - *Remote Consultation* — `durationMins`, short description, `href` CTA  
- **What to Expect (Collapsibles):** *What to Bring*, *Timeline*, *Aftercare* (each `title` + `bodyHtml`).  
- **Legal/Notes:** Optional safety and policy notes (short, non‑deterrent).

**Interaction:**  
- CTAs are `<a>` links (Begin Your Fitting as primary; Request a Visit as secondary where relevant).  
- Collapsibles via Radix Collapsible; keyboard accessible; `aria-expanded` and `aria-controls`.  
- If embedding a scheduler, load on demand (after user click); `title` attribute set; provide fallback link to open in a new tab.

**Motion:**  
- Light fade/slide-in of cards (~200–300 ms).  
- Collapsible height/opacity transitions; instant under `prefers-reduced-motion`.

**Performance:**  
- Defer any embed until user interaction; keep cards light (iconography only).  
- Ensure CTAs are prefetch-enabled and responsive.

**A11y:**  
- Clear, descriptive link text (avoid “click here”).  
- Buttons and links have visible focus states; targets ≥ 44px.  
- Collapsible content is reachable via keyboard; heading hierarchy maintained.
""")
