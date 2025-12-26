This is all super clear, and your answers are exactly what we needed to lock the bones of this thing in.

Let me do three things:

1. Confirm the era structure and how we’ll derive it from dates.
2. Talk about colors in relation to the Perazzi brand palette.
3. Give you a draft `docs/heritage-timeline-spec.md` you can drop into the repo as the “north star” for Codex and for us.

Then you can go gather photos and we’ll move on to the incremental task cards.

---

## 1. Eras + year ranges (using your current data model)

We’ll stick with **5 eras** and derive each event’s era from its `date` year (since your `date` is an exact year and there’s no explicit era field).

We can define the ranges like this:

* **Era 1 – “The Workshop in Brescia”** (`id: "founding"`)
  Years: **1957–1963**
  The birth of the workshop and the Mattarelli prototype period.

* **Era 2 – “Olympic Awakening”** (`id: "olympic_awakening"`)
  Years: **1964–1979**
  First Olympic golds, MX8, the world first really seeing Perazzi.

* **Era 3 – “The Age of Champions”** (`id: "age_of_champions"`)
  Years: **1980–1999**
  DB81, MX10, MX2000, US expansion, steady dominance and a flood of champions.

* **Era 4 – “The Bespoke Pilgrimage”** (`id: "bespoke_pilgrimage"`)
  Years: **2000–2012**
  Factory visits as ritual, MX2000 era, Daniele’s last years and London 2012.

* **Era 5 – “The Living Atelier”** (`id: "living_atelier"`)
  Years: **2013–Today**
  Mauro & Roberta’s stewardship, High Tech line, CSG partnership, TCN era.

Implementation-wise later, Codex will do something like:

```ts
const year = parseInt(event.date, 10);
// then map year into an era id based on these ranges
```

So you don’t have to retrofit Sanity right now.

---

## 2. Color moods that respect Perazzi’s core palette

From your globals + brand work, we effectively have:

* `--perazzi-red` (the iconic red)
* `--perazzi-black`
* `--perazzi-white`
* And derived tokens like `--color-canvas`, `--surface-card`, etc.

You’re right to worry about “random” overlay colors. We want every mood to feel like it’s just different facets of the same palette, not a new brand per era.

The plan:

* Use **overlay colors** as *mixes* of:

  * `var(--color-canvas)` (light/dark surface)
  * `var(--perazzi-black)`
  * `var(--perazzi-red)`
* Use `color-mix` (as you’re already doing in bands) so that all tints are just **variations of canvas, ink, and red**, not foreign hues.

For example (conceptually, not actual code here):

* **Founding** – warm ink / sepia
  `overlay = mix(canvas, black, maybe 10–15% red)` → a slightly warm, brownish ink.

* **Olympic Awakening** – cool steel with a gold hint
  `overlay = mix(canvas, black, tiny touch of red)` → cooler, but still within the same red–black–white universe.

* **Age of Champions** – balanced ink
  `overlay = mix(canvas, black)` → neutral, classic Perazzi ink.

* **Bespoke Pilgrimage** – luminous warmth
  `overlay = mix(canvas, red, a little black)` → a touch more warmth, but still clearly Perazzi.

* **Living Atelier** – deep ink with red accents
  `overlay = more black, less canvas, small red` → richer, modern, slightly more dramatic.

So yes: we’ll keep **all moods inside the Perazzi palette** and just bias the mix per era.

---

## 3. Draft `docs/heritage-timeline-spec.md`

Here’s a full spec you can save as `docs/heritage-timeline-spec.md` in your repo. This will be our shared blueprint, and later we’ll point Codex at this file in the task cards.

````markdown
# Heritage Timeline – Experience & Implementation Spec

## 0. Purpose

This component is **not** a “history widget.”  
It is the emotional core of the Heritage page:

- A **vertical story** of Perazzi’s origin and evolution.
- A place where specs disappear and the **myth** is told.
- A cinematic, scroll-driven experience that feels like walking along a wall of photographs and inscriptions.

The user should feel like they’ve stepped out of the catalog and into the **origin story room**.

---

## 1. Eras – Narrative Spine

We divide the Perazzi story into five eras.  
Each era defines:

- A **narrative chapter**.
- A **background image**.
- A **color mood** (overlay tint).
- A **year range** used to derive an era for each event.

Eras:

1. **The Workshop in Brescia** (`id: "founding"`)

   - Years: **1957–1963**
   - Essence: A small workshop in Brescia, one young gunsmith, and an unreasonable belief that he can build the world’s finest competition shotgun.
   - Background: Close, intimate workshop scene (bench, tools, early actions, maybe Daniele).
   - Overlay mood: **Warm ink / sepia**
     - Feels enclosed and intimate.
     - Implementation: mix of canvas + Perazzi black + a small amount of red for warmth.

2. **Olympic Awakening** (`id: "olympic_awakening"`)

   - Years: **1964–1979**
   - Essence: The world hears the name. First Olympic gold, MX8, a new standard quietly enters the arena.
   - Background: Olympic-era imagery (trap fields, silhouettes under stadium lights, early podiums).
   - Overlay mood: **Cool steel with a hint of gold**
     - Slightly cooler than Era 1, with crispness that feels like stadium light.
     - Implementation: canvas + black with a subtle hint of red to keep it in palette.

3. **The Age of Champions** (`id: "age_of_champions"`)

   - Years: **1980–1999**
   - Essence: The dynasty years. DB81, MX10, MX2000, US expansion, dozens of world and Olympic medals.
   - Background: Collage-like scenes of champions on the line, ATA, ISSF, sporting clays legends.
   - Overlay mood: **Balanced ink**
     - Neutral, confident; like a well-exposed black-and-white with a touch of warmth.
     - Implementation: primarily canvas + black.

4. **The Bespoke Pilgrimage** (`id: "bespoke_pilgrimage"`)

   - Years: **2000–2012**
   - Essence: Perazzi as a rite of passage. Factory visits, try-guns, selecting your wood blank; Daniele’s last years.
   - Background: Fitting tunnels, showroom, hands on wood and metal, the Botticino factory as a destination.
   - Overlay mood: **Warm luminous**
     - Feels like late-afternoon light in the workshop.
     - Implementation: canvas + black with a stronger warm/red bias than Era 1.

5. **The Living Atelier** (`id: "living_atelier"`)

   - Years: **2013–Today**
   - Essence: Mauro & Roberta’s era, High Tech, CSG partnership, TCN storytelling. The atelier is alive and evolving.
   - Background: Modern Botticino scenes, High Tech receivers, champions in motion under modern light.
   - Overlay mood: **Deep ink with red accents**
     - Darker, modern, slightly electric, with glints of Perazzi red.
     - Implementation: heavier black + canvas + red accent.

**Derivation rule for events:**

- `HeritageEvent.date` is a string containing an exact year (e.g. `"1968"`).
- We parse `year = parseInt(event.date, 10)` and assign:

  ```text
  1957–1963 → "founding"
  1964–1979 → "olympic_awakening"
  1980–1999 → "age_of_champions"
  2000–2012 → "bespoke_pilgrimage"
  2013–present → "living_atelier"
````

Later, we can add an explicit `event.era` field in Sanity if we want more control, but v1 will derive from year.

---

## 2. Background Scene System

The background of the BrandTimeline is a **scene manager**:

* It manages **one hero background image per era**.
* It smoothly **crossfades** between them as the user scrolls into events from that era.
* It animates a **color overlay** (tint) over those images based on the active era.

### 2.1 Background assets

All background images live under:

* `public/redesign-photos/heritage/`

Recommended filenames:

* Era 1 (founding):
  `/redesign-photos/heritage/pweb-heritage-era-1-founding.jpg`
* Era 2 (olympic awakening):
  `/redesign-photos/heritage/pweb-heritage-era-2-olympic.jpg`
* Era 3 (age of champions):
  `/redesign-photos/heritage/pweb-heritage-era-3-champions.jpg`
* Era 4 (bespoke pilgrimage):
  `/redesign-photos/heritage/pweb-heritage-era-4-bespoke.jpg`
* Era 5 (living atelier):
  `/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg`

Each image should be:

* Wide, cinematic, and composed to carry mood more than detail.
* High enough resolution to look clean across a full band.

### 2.2 Behavior

* At the top of the component, we render **all era backgrounds stacked** behind the content.

* Only one era background is **fully visible** at a time; others are at low opacity.

* As the **active era changes** (based on which chapter is in view):

  * The new era’s background fades **up** in opacity.
  * The previous era’s fades **down**.
  * The overlay tint transitions toward the new era’s mood color.

* On `prefers-reduced-motion`, these transitions become quick fades or hard cuts (no long animations).

---

## 3. Chapter Layout (Foreground Content)

Each `HeritageEvent` becomes a **chapter** in a vertical storyline.

### 3.1 Desktop layout

* The timeline lives inside a full-width band (like shotguns/bespoke bands):

  * Full-bleed background.
  * Inner container centered: `max-w-7xl`.
* Within the inner container:

  * A **vertical spine** runs along one side (left or center):

    * Thin line.
    * Small markers for each event (and/or decade labels).
  * Events are rendered as **stacked chapters** along the spine:

    * Each chapter has:

      * Date label (`event.date`).
      * Title (`event.title`).
      * Large image (if provided).
      * Summary text (`summaryHtml`).
      * Optional “Read” links and a `MilestoneDetailDrawer` for deeper artifact-level content.

    * Layout alternates:

      * For event index 0, 2, 4, …:

        * Image on left, text on right.
      * For event index 1, 3, 5, …:

        * Text on left, image on right.

    * The chapter should feel like a **magazine spread**, not a card.

### 3.2 Mobile layout

* Spine collapses into a subtle horizontal or inline indicator; scroll is main navigation.

* Chapters render stacked:

  * Date → title → image → story → links → drawer.

* No alternating columns on small screens; the story reads naturally top-to-bottom.

### 3.3 Event detail

* `MilestoneDetailDrawer` remains per-event and is treated as a **deep dive**:

  * A small “View more from this moment” CTA near the bottom of the chapter opens the drawer.
  * Drawer content remains as-is (gallery, long text, etc.).

---

## 4. Active Era & Event – Scroll Logic

We use **scroll-based observation** to drive which event and which era are “active”.

### 4.1 Per-chapter observation

* Each chapter container has a `whileInView` or `IntersectionObserver` hook:

  * When a chapter enters the viewport (e.g. 40–60% of the viewport height):

    * Set `activeEventId` to that event’s ID.
    * Compute its era from the year and set `activeEraId`.
    * Log `TimelineEventViewed:{id}` if it hasn’t been logged yet.

* Only the **first time** a chapter enters view do we log analytics for that event.

### 4.2 Active era → background & overlay

* `activeEraId` controls:

  * Background opacity of each era’s hero image.
  * Overlay tint color.

Example behavior:

* User scrolls from a 1962 event into a 1968 event:

  * `activeEraId` changes from `founding` to `olympic_awakening`.
  * Background crossfades from Era 1 image to Era 2 image.
  * Overlay tint transitions from warm ink to cool steel/gold.

---

## 5. Accessibility & Keyboard

* Keep a **“Skip timeline”** link at the top, as we already do, leading to the section after the timeline.
* Each chapter should be reachable via tabbing.
* We may keep a minimal jump list for keyboard users (e.g., a simple list of year links near the top that scroll to each event).

The chapter experience should remain fully usable with:

* Only scroll + tab, no pointer.
* Proper heading structure (`h2` for the overall timeline, `h3` for events).

---

## 6. Implementation Phases (for Codex)

We’ll implement this in small steps. Each step will get its own task card.

**Phase 1 – Era config + MD spec**

* Add this spec file (`docs/heritage-timeline-spec.md`) to the repo.
* Create a small TypeScript config in `src/config/heritage-eras.ts` that encodes:

  * Era IDs, labels, year ranges.
  * Background image paths.
  * Overlay mood keys (no animation yet).

**Phase 2 – Replace card/tab layout with vertical chapter layout**

* Remove the existing “tablist on the left / panel on the right” structure.
* Render all `HeritageEvent`s as stacked chapters in a vertical layout (with alternating image/text).
* Keep the existing background as a simple neutral band (no era crossfade yet).
* Keep `MilestoneDetailDrawer` integrated per chapter.

**Phase 3 – Background scene manager (static switching by era)**

* Add the era backgrounds (image stack + overlay layer).
* As a first pass, switch backgrounds when the user enters a new era (hard switch or quick fade, no fancy interpolation yet).
* Confirm year → era mapping is working.

**Phase 4 – Animated crossfade + overlay tint transitions**

* Replace hard switches with animated transitions:

  * Crossfade between eras.
  * Animate overlay tint colors.
* Respect `prefers-reduced-motion`.

**Phase 5 – Polish**

* Spine styling (thickness, markers, decade labels).
* Typographic tuning for dates and titles.
* Refining copy spacing and max-widths for best readability.
* Ensure `MilestoneDetailDrawer` still feels like a considered part of the experience (not tacked on).

---

End of spec.

```

---

Next step on your side:

- Confirm you’re happy with these 5 eras + names as written.
- Drop in 5 background images at the suggested paths (you can adjust filenames if you’d like, and we’ll just reflect that in the spec/config).
- Once that’s done, we’ll start with **Phase 1**: creating the TS config and wiring the era derivation, then move to the vertical chapter layout.
```
