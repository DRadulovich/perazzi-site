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
