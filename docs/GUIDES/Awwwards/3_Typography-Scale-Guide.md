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
`type-card-body`




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
