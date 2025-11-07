files["4_Heritage_Timeline_Spec.md"] = textwrap.dedent("""\
# Heritage & History – Brand Timeline (Interactive)

## B. Brand Timeline *(new; keyboardable scrollytelling with list fallback)*
**Purpose:** Milestones from **1957 → today**—founding, Olympic wins, model debuts, family continuity, 2023 partnership—presented as a calm, scrollable narrative.

**Fields (per event):**  
`id`, `date` (YYYY or YYYY‑MM‑DD), `title`, `summaryHtml`, `media?: FactoryAsset`, `links?: { articles?: Article[], platforms?: Platform[], champions?: Champion[] }`

**States & Interaction:**  
- **Desktop:** Vertical rail with milestone markers (left); content panel (right). Click/Enter/Space selects an event; ArrowUp/ArrowDown and PageUp/PageDown move between events; Home/End jump to first/last. **No scroll‑jacking**.  
- **Mobile:** Stacked `<ol>` of events; tapping a compact date‑marker scrolls to the event heading.  
- Provide **“Skip timeline”** link before module (anchors to next section).

**Motion Grammar:** Panel fade/slide (200–300 ms ease‑out); marker highlight change; disabled under reduced‑motion.

**Image/Video Guidelines:** Event media loads lazily; captions describe historical context; short clips loop muted with poster; no autoplay with sound.

**Performance:** Lazy‑load offscreen media; prefetch next event image on selection; keep container height constant to avoid CLS; maintain ≥ 60 FPS during marker navigation.

**A11y Checklist:**  
- Markers in `<nav aria-label="Brand timeline">`; active marker `aria-current="true"`.  
- Each event is a semantic section with a heading; DOM order matches visual order.  
- Focus never trapped; **Escape** returns to timeline nav if inside detail panel.  
- **List fallback:** If JS off, render an `<ol>` of events with media inline; all content visible.  
- Live updates are polite; announce only the new event title on selection.
""")