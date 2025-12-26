# Perazzi Digital Visual Language

Implementation note for Codex:
- **Tokens, fonts, and base surfaces are defined in `src/app/globals.css`.**
- Do **not** hardcode colors or fonts in components. Use Tailwind theme tokens (e.g. `text-perazzi-red`, `bg-canvas`) or the CSS variables defined there.

---

## 0. North Star

The Perazzi site is a **digital atelier** built on world-class photography of shotguns, shooters, and the field. The UI behaves like quiet exhibition design: it guides, frames, and protects the imagery without competing for attention.

**Pillars:**

1. **Photo-first**  
   Imagery carries the emotion and story. UI only steps in when it needs to explain, guide, or help someone act.

2. **Minimal, cinematic UI**  
   Few patterns, used consistently. Overlays feel like smoked glass or matte lacquer, not neon glassmorphism. Layouts are simple and confident.

3. **Materials, not trends**  
   Visual language comes from Perazzi’s real materials: black steel, walnut, leather, smoke. Avoid trendy gradients and glows that feel off-brand.

---

## 1. Page Archetypes & Atmospheres

Each major page belongs to one of these “rooms” and borrows its mood. Codex should pick the most appropriate archetype and keep the page consistent with it.

### 1.1 Field

Pages: `/shotguns`, platform pages (`/shotguns/ht`, `/mx`, etc.), some parts of `/experience`.

- Mood: cinematic, kinetic, confident.
- Theme: usually **dark** (`[data-theme="dark"]` active).
- Imagery: action shots, clays, field scenes, guns in use.
- Surfaces: deep ink backgrounds, smoked overlays for type on images.

### 1.2 Atelier

Pages: `/bespoke`, `/concierge`, fitting-related flows.

- Mood: intimate, ritual, slow.
- Theme: also dark, but with more localized pools of light.
- Imagery: hands, fittings, close details of wood and steel.
- Surfaces: darker backgrounds, more smoked panels, fewer busy cards.

### 1.3 Archive

Pages: `/heritage`, `/journal`, some editorial subsections.

- Mood: reverent, contemplative, editorial.
- Theme: can mix dark and light (`--surface-canvas` and `--surface-card`), with serif accents.
- Imagery: old photos, portraits, engravings, factory history.
- Surfaces: matte panels, possible subtle “print-like” treatment, but still minimal.

### 1.4 Workshop

Pages: `/service`, `/engravings`, utility tools (lookup, tables, FAQs).

- Mood: clear, trustworthy, uncompromising.
- Theme: dark or neutral backgrounds; emphasis on clarity over drama.
- Imagery: benches, parts, tools, clean technical shots.
- Surfaces: solid matte panels with clear hierarchy and legible type.

> **Note:** Certain scenes (e.g., the home “workshop” timeline band) may intentionally force `data-theme="dark"` on their root section even when the global page theme is light, to preserve a dark photographic environment while still using glass cards for content.

---

## 2. Photography System

Photography is the hero. Components should be designed to **frame** it, not clutter it.

### 2.1 Image categories

- **Hero Frames**
  - Full-bleed, wide aspect (16:9 or wider).
  - Single clear subject (gun, shooter, detail).
  - Used for page heroes and big cinematic bands.

- **Story Frames**
  - Medium shots of people, guns, and scenes.
  - Used in grids, galleries, and supporting sections.

- **Detail Frames**
  - Macro shots of engraving, triggers, safeties, materials.
  - Used in craft/engraving sections, small supporting panels, or as background layers.

### 2.2 Treatment & grading (conceptual)

- Blacks: rich, not crushed.
- Highlights: protected; no blown whites on metal or sky.
- Overall:
  - Field: slightly cooler, higher contrast.
  - Atelier: slightly warmer, softer contrast.
  - Archive: may use desaturation or monochrome selectively.
  - Workshop: neutral, honest, technical.

Codex does **not** adjust photography; it assumes images already follow this art direction and designs components around them.

### 2.3 Usage rules

- Hero images should be large and confident. Avoid shrinking key photos into small cards.
- Avoid tiny floated images inside large cards. If the photo is the point, it should occupy most of the component.
- Avoid repeating the exact same frame multiple times on a single page.

---

## 3. Surface & Material System

### 3.1 Base tokens (from `globals.css`)

Use these variables and Tailwind bindings:

- Brand:
  - `--perazzi-red`, `--perazzi-black`, `--perazzi-white`
  - Tailwind: `text-perazzi-red`, `bg-perazzi-black`, etc.
- Light surfaces:
  - `--surface-canvas`, `--surface-card`, `--surface-elevated`
- Dark surfaces (when `[data-theme="dark"]` is set):
  - `--surface-canvas`, `--surface-card`, `--surface-elevated` are overridden to dark neutrals.
- Ink:
  - `--ink-primary`, `--ink-muted` (via `--color-ink`, `--color-ink-muted`)

Do not introduce new raw hex colors in components unless explicitly asked to extend the palette.

### 3.2 Surface types

**Base Canvas**

- Light theme: `bg-canvas` → `--surface-canvas` (Perazzi white).
- Dark theme: `bg-canvas` → `#0F0F10` (dark neutral).
- Used as page background in each archetype; most sections rest directly on this layer.

**Matte Panel**

- Background: `bg-card` / `bg-elevated` according to theme.
- Slight border: `border-border` when needed.
- Soft radius: prefer `rounded-2xl` or `rounded-3xl` (note: overridden to sharper radii in `globals.css`).
- Used for:
  - Service/utility sections.
  - Journal/heritage cards.
  - Any structured content that is not sitting directly over imagery.

**Smoked Glass Overlay**

- Used primarily when large blocks of text sit directly over photography or video.
- Implementation:
  - Base: a dark translucent background using `--scrim-strong` or `--scrim-soft`, often with `backdrop-filter: blur(...)`.
  - No bright borders or neon glows.
  - Generous padding, enough for headline + short copy + 1–2 CTAs.

Rules:

- Use smoked overlays for **legibility scrims** behind text-on-image moments (heroes, cinematic strips).
- Do not use smoked overlays on flat matte backgrounds unless there is a strong reason.
- Limit to at most two overlay variants:
  - Hero overlay (larger).
  - Caption overlay (smaller).

**Glass Cards (dark or light)**

- Used for: cards and active controls that “float” over rich imagery or dark bands (e.g., the home craft timeline rail + text card).
- Implementation:
  - Background: `bg-[color:var(--color-canvas)]/40–60` with `backdrop-blur-sm`.
  - Border: `border-[color:var(--border-color)]`.
  - Use `text-ink` / `text-ink-muted` for content.
- Behavior:
  - In dark contexts (`data-theme="dark"` or section-level dark), `--color-canvas` is dark → **smoked glass** card.
  - In light contexts, `--color-canvas` is light → **white glass** card.
- Prefer glass cards for:
  - Timeline cards.
  - Over-image narrative cards where the band itself is photographic.
  - Key focus elements that should feel premium but not heavy.

---

## 4. Layout & Spacing

### 4.1 Grid & container

Use the container sizes defined in `@theme inline`:

- `max-w-6xl` or `max-w-7xl` for the main content frame.
- Horizontal padding:
  - Mobile: `px-4`.
  - Medium: `px-6`.
  - Desktop: `px-8` or equivalent.

Do not introduce arbitrary max-widths; use the existing `max-w-*` utilities provided in the utilities layer in `globals.css`.

### 4.2 Vertical rhythm

- Major sections: aim for `py-16–24` on desktop, `py-12–16` on mobile.
- Cinematic strips (full-bleed images) should have slightly more breathing room above and below than dense sections with cards.
- Keep section spacing consistent within a page archetype; avoid random variations.

### 4.3 Hero patterns

Primary hero (all archetypes):

- Full-bleed image.
- Text block pinned to a corner or side, not dead center by default.
- One primary CTA button, one optional secondary text link or outline button.
- If text sits directly on the image, wrap it in a smoked overlay panel or glass card.

Secondary hero / interlude (cinematic strips):

- Full-bleed or edge-to-edge image band.
- Either:
  - A small overlay with a short label and 1–2 lines of copy, or
  - No overlay; follow with a caption section below.

---

## 5. Component Language

### 5.1 Card types

Codex should default to these patterns and avoid inventing new ones without reason.

**Narrative Card**

- Purpose: story, person, platform, or experience.
- Background:
  - Matte panel (`bg-card` / `bg-elevated`), or
  - Glass card when it sits over a rich photographic band.
- Content:
  - Optional small label.
  - Title.
  - Short paragraph or two.
  - A single primary CTA.
- Should visually defer to nearby photography: more “caption block” than “UI widget.”

**Utility Card**

- Purpose: tools, FAQs, lookup, service instructions, tables.
- Background: matte panel (no translucency by default).
- Can be denser; clarity > mood.
- May include primary and secondary actions, but should still respect CTA hierarchy rules (see below).

**Hero Overlay Panel**

- Purpose: top-of-page moment or a key cinematic beat.
- Background: smoked overlay (`--scrim-strong` / `--scrim-soft` + blur).
- Larger type; minimal CTAs.
- May be more visually dominant than other cards.

> Glass cards are a **styling** used primarily by narrative cards and active controls in photographic bands; they are not a separate semantic card type.

### 5.2 CTAs and buttons

Use the button classes defined in `globals.css`:

- Primary CTA:
  - `.btn--primary` or `.button-primary` (Perazzi red or ink, pill radius).
- Secondary CTA:
  - `.button-secondary` or outline-style Tailwind button with border using `--border-color` or `--subtle`.

Rules per section:

- Only one primary CTA should be visually dominant.
- Secondary actions:
  - Outline buttons, or
  - Simple text links next to/below the primary.

Do not create new button color schemes for new components unless explicitly instructed.

---

## 6. Motion & Interaction

### 6.1 Motion personality

- Motion should feel like **camera moves**, not bouncy UI:
  - Gentle fades, slides, and parallax.
  - No aggressive spring animations or elastic effects.
- Always respect `prefers-reduced-motion`:
  - Provide instant or minimal-motion variants for users who prefer less animation.

### 6.2 Where motion belongs

- Heroes:
  - Optional parallax or opacity shifts on scroll.
  - Simple entrance animations are okay if subtle.
- Timelines/steppers:
  - Animate progress indicators and content transitions.
- Navigation:
  - Shadow/opacity adjustments on scroll.
  - Flyout menus can fade/slide in/out.
- Cards:
  - Minimal hover feedback (slight elevation, border or background subtle change).
  - Avoid dramatic transforms.

---

## 7. Image Performance Guidelines

### 7.1 Hero & cinematic images

- Use high-quality sources and let `next/image` or similar handle responsive resizing and formats.
- Prefer:
  - Good resolution (e.g. 2× target display width).
  - Modern formats (WebP/AVIF) with moderate compression.
- Ensure wood grain and engraving details remain crisp on:
  - Large desktop displays.
  - Typical laptops.

### 7.2 Supporting images

- Slightly higher compression is acceptable for:
  - Small card images.
  - Thumbnails.
- Do not upscale low-res images; choose a different frame if necessary.

### 7.3 General rule

If an image is used as a **hero** or major cinematic strip, it must look clean and detailed on both laptop and large monitor. Supporting images can be lighter-weight but should never visibly degrade into mush or banding.

---

## 8. Typography (Baseline from `globals.css`)

Typography will be tuned more precisely after Perazzi provides final copy. For now:

### 8.1 Source of truth

All typography-related tokens live in `src/app/globals.css`:

- Fonts:
  - `--font-sans` → `var(--font-geist-sans)`, Inter, Segoe UI, system.
  - `--font-serif` → "Playfair Display", Georgia, serif.
  - `--font-mono` → `var(--font-geist-mono)` and similar.
- Base styles:
  - `body` sets `font-family: var(--font-sans)`, `line-height: 1.6`, and text color from `--color-ink`.
- Rich/long-form content:
  - `.prose` settings hook into `@tailwindcss/typography` and map to the ink and surface tokens.

Codex must **not** redefine fonts or body typography in components. Use Tailwind typography utilities and the `.prose` class for rich content.

### 8.2 Interim rules

Until a final type scale is defined:

- Use Tailwind heading sizes consistently (`text-2xl`, `text-3xl`, etc.) for section titles.
- Keep hero headings visually dominant relative to body copy, but not absurdly oversized.
- Keep micro-labels readable; avoid extremely tight letterspacing or very small sizes over detailed imagery unless wrapped in a glass or smoked overlay.

Later, a dedicated typography section can be added to this doc once brand-approved copy is available.

---

End of doc.
