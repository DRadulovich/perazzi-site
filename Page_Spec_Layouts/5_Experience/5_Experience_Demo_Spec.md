files["5_Experience_Demo_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Demo Program (“Aspirant Series”)

## E. Demo Program — “Aspirant Series” *(new; event & request flow)*
**Purpose:** Let prospects feel a Perazzi—through demo days, partner ranges, or request queue.

**Fields:**
- **Program Intro (editorial)**
- **Upcoming Demos (optional):** `events?: [{ id, date, clubName, cityState, href? }]`
- **Demo Request CTA:** `{ label, href }`
- **What to Expect:** bullets (safety, basics, etiquette)

**States & Interaction:**
- Optional state/region filter using button chips (`aria-pressed` toggles).
- Event cards link to details or external registration (open in new tab with `rel="noopener noreferrer"`).
- Request CTA → contact/request form (simple fields; no sensitive data).

**Motion:** Subtle fade on list; filter adds/removes items without motion thrash; reduced‑motion = instant.

**Image/Video:** Editorial stills preferred; loops must be silent and short; captions descriptive & non‑commercial.

**Performance:** No infinite scroll; paginate or “view more”; lists work with JS off (plain links).

**A11y:** Filter chips are `<button>` with `aria-pressed`; cards are single‑link tiles; external links announce new‑tab behavior via visually hidden text; keyboard access filter → list → CTA.
"""])