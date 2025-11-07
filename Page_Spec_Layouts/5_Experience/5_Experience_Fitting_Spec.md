files["5_Experience_Fitting_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Book a Fitting

## D. Book a Fitting — “Begin Your Fitting” *(reuse from Bespoke Build; copy deltas for experience context)*
**Purpose:** Convert intent to scheduled time through clear options.

**Fields:**
- **Options (cards):** “Factory Fit”, “U.S. Fitting Center(s)”, “Remote Consultation” — each `{ id, title, durationMins, descriptionHtml, href }`
- **What to Bring / Timeline / Aftercare:** collapsibles (refined tone for experience context).

**States & Interaction:**
- Cards are links (Primary CTA: Begin Your Fitting); optional **on‑demand** scheduler loads after click (dialog or inline).
- Iframe has a `title` and explicit fallback link (“Open booking in a new tab”).

**Motion:** Light card fade; collapsible transitions; reduced‑motion = instant.

**Performance:** Scheduler iframe lazy‑loads on demand; reserve container height; no blocking scripts; **CLS ≤ 0.05**.

**A11y:** True `<a>` links; iframe titled and keyboardable; collapsibles with `aria-expanded`/`aria-controls`; visible focus; contrast ≥ 4.5:1.
"""])