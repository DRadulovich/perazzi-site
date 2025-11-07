files["3_Bespoke_Steps_Spec.md"] = textwrap.dedent("""\
# Bespoke Build – Fitting & Build Steps Scroller

## C. Fitting Steps Scroller *(new; analogous to Home `TimelineScroller`)*

**Purpose:** Walk the user through the core phases of the bespoke journey, revealing the craft and the feeling behind each step.
**Canonical Steps (ordered):**
1. **Discovery & Consultation** — goals, history, vision; on‑site or remote.  
2. **Precision Fitting (Try‑Gun)** — length of pull, cast, drop; stance; you’ll “feel it click.”  
3. **Barrel & Regulation** — boring & choke decisions; patterning; POI ranges as bands.  
4. **Balance & Dynamics** — barrel weight, moment of inertia; lively vs stable.  
5. **Engraving & Wood** — house patterns vs master engravers; wood selection & finish.  
6. **Delivery & On‑Range Validation** — first shots; micro‑adjustments; aftercare.

**Fields (per step):**
- `id: string` (e.g., 'discovery', 'fitting', 'regulation', 'balance', 'engraving', 'delivery')  
- `title: string`  
- `bodyHtml: string` (editorial; not spec sheet)  
- `media: FactoryAsset` with `aspectRatio`, optional `captionHtml`  
- `cta?: { label: string; href: string }`

**States & Interaction:**
- **Desktop (lg↑):** Pinned media column; text column scrolls through steps; step index indicator (`aria-current="step"`).  
- **Mobile (<lg):** Stacked sections; no pinning; optional collapsibles for long text (first step open by default).  
- **Skip Link:** Provide a “Skip step‑by‑step” link *before* the scroller to jump to the next section.

**Motion Grammar:** 
- IntersectionObserver + CSS/WAAPI fade/translate (200–400 ms).  
- If using Framer for pinning, gate by `matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')`.  
- Under reduced‑motion: no pinning; no transforms; static reveal.

**Media Guidelines:**
- Use authentic atelier imagery/video (stock fitting, choke boring, proofing); no loud audio; respect safety.  
- Provide informative captions (`<figcaption>`), or `alt=""` for purely decorative images.  
- Preload the first media; lazy‑load subsequent assets; pause offscreen video.

**Performance:**
- Reserve height for the media container to avoid CLS.  
- Preload the next step’s media when current step reaches ≈66% visibility.  
- Maintain ≥60 FPS when pinning; leverage GPU transforms only; avoid layout trashing in scroll handlers.

**A11y:**
- DOM order matches visual reading order.  
- Step navigation keyboard accessible; `aria-live="polite"` updates for step count if applicable.  
- No keyboard traps; collapsibles use `aria-expanded`/`aria-controls`.  
- Provide clear focus states; ensure contrast for all text over imagery (use scrims if needed).
""")