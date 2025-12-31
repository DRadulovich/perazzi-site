# Typography Scale Guide (Site Theme)

This guide shows where to edit global font sizes and how to apply the correct typography styles across the site.

## Source Of Truth (Edit Here)

All global font sizes and typography styles live in:

`src/styles/site-theme.css`

Look for these sections:

1) **Font Family Variables**
   - `--font-sans`
   - `--font-serif`
   - `--font-serif-small-caps`
   - `--font-serif-petite-caps`
   - `--font-artisan`
   - `--font-mono`

Current font families (from the Adobe kit) map to:

- Neue Haas Grotesk Text → `--font-sans` (`neue-haas-grotesk-text`)
- Mrs Eaves Roman → `--font-serif` (`mrs-eaves`)
- Mrs Eaves Roman Small Caps → `--font-serif-small-caps` (`mrs-eaves-roman-small-caps`)
- Mrs Eaves Roman Petite Caps → `--font-serif-petite-caps` (`mrs-eaves-roman-petite-caps`)
- Adobe Handwriting Ernie → `--font-artisan` (`adobe-handwriting-ernie`)

2) **Type Size Tokens**
   - `--type-display`
   - `--type-section`
   - `--type-title-lg`
   - `--type-title-md`
   - `--type-title-sm`
   - `--type-body-lg`
   - `--type-body`
   - `--type-body-sm`
   - `--type-caption`
   - `--type-label`
   - `--type-button-lg`

3) **Type Classes**
   - `.type-display`
   - `.type-section`
   - `.type-title-lg`
   - `.type-title-md`
   - `.type-title-sm`
   - `.type-body-lg`
   - `.type-body`
   - `.type-body-title`
   - `.type-body-sm`
   - `.type-caption`
   - `.type-label`
   - `.type-label-tight`
   - `.type-caps`
   - `.type-nav`
   - `.type-ui`
   - `.type-button`
   - `.type-button-lg`
   - `.type-button-plain`
   - `.type-quote`

When you want to change a font size globally, update the **Type Size Tokens**.
When you want to change font family, weight, transform, or tracking for a role, update the **Type Classes**.

## How To Use The Type Classes

Use these from components or in Tailwind className strings:

- `type-display` (Hero Title, Mrs Eaves Petite Caps)
- `type-section` (Group Parent Section Title, Mrs Eaves Small Caps)
- `type-title-lg` / `type-title-md` / `type-title-sm` (Group Child Section Title, Mrs Eaves Italic)
- `type-body-lg` / `type-body` / `type-body-sm` (Body, Neue Haas 55 Roman)
- `type-body-title` (Small caps body-title, Mrs Eaves Roman Small Caps)
- `type-quote` (Quotes, Neue Haas 55 Roman)
- `type-label` / `type-label-tight` (Eyebrow, Neue Haas 55 Roman, uppercase)
- `type-button` / `type-button-lg` (Buttons, Neue Haas 65 Medium, uppercase)
- `type-button-plain` (Sentence-case buttons, Neue Haas 55 Roman)
- `font-artisan` (Soul Journey "Artisan" font)
- `prose-journal` (Journal article body, Mrs Eaves Roman)

## Role Cheat Sheet

Use this mapping when tagging page content:

- Hero Title → `type-display`
- Hero Subtitle → `type-title-lg` or `type-title-md` (italic)
- Eyebrow → `type-label` or `type-label-tight` (uppercase)
- Group Parent Section Title → `type-section`
- Group Child Section Title → `type-title-lg` / `type-title-md` / `type-title-sm` (italic)
- Body → `type-body` (or `type-body-lg` for lead)
- Body Italics / Quotes → `type-quote` (sans) or `prose-journal` (serif italics in articles)
- Body Title (small caps) → `type-body-title`
- Buttons → `type-button` or `type-button-lg`
- Sentence-case Buttons → `type-button-plain`
- Journal Article Body → `prose-journal` on the article container
- Journal Article Quotes → handled by `prose-journal`
- Soul Journey “Artisan” Font → `font-artisan`

HERO TITLE
`type-display`
HERO EYEBROW
`type-label-tight`
SECTION TITLE
`type-section`
SECTION SUBTITLE
`type-section-subtitle`
CARD TITLE
`type-card-title`
CARD BODY
`type-body`




## Common Edits (What You Can Modify)

In `src/styles/site-theme.css`, you can safely modify:

- **Font size**: edit the `--type-*` tokens.
- **Font family**: edit the `font-family` in the `.type-*` classes.
- **Font weight**: edit `font-weight` in the `.type-*` classes.
- **Letter spacing**: edit `letter-spacing` in the `.type-*` classes.
- **Uppercase behavior**: edit `text-transform` in `.type-label`, `.type-label-tight`, `.type-button`, etc.
- **Line-height**: edit `line-height` in the `.type-*` classes.
- **Italic behavior**: edit `font-style` in `.type-title-*` or `type-quote`.

## Journal-Specific Typography

Journal article body should use Mrs Eaves Roman:

- Apply `prose-journal` on the article container.
- Quotes inside will use Mrs Eaves Italic.

## Example Usage

```tsx
<Heading size="xl" className="type-section">Craftsmanship Journey</Heading>
<Text size="md" className="type-body">Body copy goes here.</Text>
<Text asChild className="type-quote">
  <blockquote>Quote text</blockquote>
</Text>
<button className="type-button">Explore shotguns</button>
```

## Quick Checklist

- Change sizes? Edit `--type-*` tokens.
- Change font family/weight/transform? Edit `.type-*` classes.
- Apply styles on pages? Use `Heading`, `Text`, or `type-*` classes.

---

# Typographic System Overview

The typography of the Perazzi website is designed as a **conversation between heritage and precision**. Each typeface serves a distinct cognitive role, guiding the reader between moments of reverence, clarity, and action. The system deliberately separates *meaning* from *function*, allowing the experience to feel both human and exacting—much like a bespoke Perazzi itself.

---

## **Mrs Eaves — The Voice of Heritage, Craft, and Meaning**

Mrs Eaves is used wherever the site speaks about *why* something matters. It carries history, imperfection, and humanity in its forms. This typeface is intentionally reserved for moments that ask the reader to slow down, reflect, or feel continuity with tradition.

### **Hero Titles — Mrs Eaves Roman Petite Caps**

**Intent:** Establish authority without spectacle
**Feeling:** Engraved, deliberate, timeless
**Purpose:** The hero title sets the emotional tone of the page. Petite caps evoke the language of engraving, archival book titles, and artisan marks—refined but restrained. At large scale, the compressed proportions create gravity without shouting, signaling mastery earned over time.

This is the typographic equivalent of a hand-cut line: controlled, confident, and permanent.

---

### **Hero Subtitles & Quotes — Adobe Handwriting Ernie**

**Intent:** Introduce human voice and narrative flow
**Feeling:** Personal, reflective, human
**Purpose:** The handwriting form is used where the site *speaks*, rather than declares. It suggests thought, dialogue, and intention—acting as a counterbalance to the authority of the caps above it. In both hero subtitles and qoutes, it signals a deeper layer of meaning within a larger structure, reminding the reader that human hands built this.

This treatment implies that someone is present behind the craft.

---

### **Group Section Titles — Mrs Eaves Roman Small Caps**

**Intent:** Create hierarchy within tradition
**Feeling:** Editorial, composed, quietly formal
**Purpose:** Small caps function as chapter markers. They establish structure while remaining within the serif world, preserving tonal continuity. Compared to the hero’s petite caps, they are less intense—signaling organization rather than proclamation.

These titles orient the reader without breaking the spell of craftsmanship.

---

### **Journal Article Body — Mrs Eaves Roman**

**Intent:** Create a distinct space for contemplation
**Feeling:** Literary, reverent, unhurried
**Purpose:** Journal articles are treated as a different cognitive environment from the rest of the site. Mrs Eaves Roman is used here to slow reading pace, encourage depth, and give the text room to breathe. Its wider proportions and softer rhythm signal that the reader has entered a reflective space, closer to a book or essay than a product page.

This choice reinforces that knowledge, story, and lineage deserve patience.

---

## **Neue Haas Grotesk — The Voice of Clarity, Navigation, and Action**

Neue Haas Grotesk is used wherever the site needs to *function*. It is neutral, precise, and invisible when used correctly. This typeface ensures that clarity never competes with meaning.

### **Hero Eyebrows — Neue Haas Grotesk Text 55 Roman (All Caps)**

**Intent:** Provide orientation and context
**Feeling:** Calm, precise, modern
**Purpose:** Eyebrows act as metadata. Using Neue Haas Grotesk in all caps distinguishes them from the emotional content below and signals factual framing—brand name, category, or section context. This keeps hierarchy clean and prevents confusion between narrative and navigation.

It answers “where am I?” without demanding attention.

---

### **Body Copy — Neue Haas Grotesk Text 55 Roman**

**Intent:** Maximize readability and effortlessness
**Feeling:** Neutral, balanced, unobtrusive
**Purpose:** The primary body copy uses Neue Haas Grotesk to disappear in service of content. Its proportions and spacing are optimized for screen reading, allowing users to move through complex information without fatigue. This ensures that comprehension remains frictionless.

The font does not perform—it supports.

---

### **Body Italics — Neue Haas Grotesk Text 56 Italic**

**Intent:** Emphasize without changing voice
**Feeling:** Subtle, controlled, coherent
**Purpose:** Italics are kept within the same family to preserve flow and continuity. Emphasis comes from rhythm and spacing rather than stylistic contrast, ensuring that quoted or highlighted material feels integrated, not ornamental.

This keeps the reader anchored.

---

### **Buttons & UI Actions — Neue Haas Grotesk Text 65 Medium**

**Intent:** Signal decisiveness and interactivity
**Feeling:** Confident, intentional, engineered
**Purpose:** A slightly heavier weight is used for buttons to communicate action without aggression. It distinguishes interactive elements from passive text while maintaining typographic consistency across the interface.

This reinforces trust: actions feel deliberate, not promotional.

---

# System Philosophy (In Plain Terms)

* **Mrs Eaves** handles *meaning, memory, and voice*
* **Ernie** handles *the human element*
* **Neue Haas Grotesk** handles *clarity, structure, and motion*

Serif and sans-serif are not mixed arbitrarily. They are assigned roles based on how a reader thinks and feels at different moments in the experience. The result is a typographic system that mirrors Perazzi itself:
**heritage and precision existing together without compromise.**


