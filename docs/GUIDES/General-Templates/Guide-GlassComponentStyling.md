# Component Styling Guide
## Heritage “Glass Section” Pattern

This document defines the styling pattern used in `ChampionsGallery.tsx` and similar cinematic, full-bleed sections.

Use this guide when asking an AI assistant or another dev to “restyle component X to match the Heritage Glass Section pattern.”

---

## 1. Visual Language Overview

**Intent**

- Cinematic, full-bleed background (photo) with a soft, atmospheric treatment.
- Foreground content sits inside a **glass panel**:
  - Rounded corners  
  - Subtle border  
  - Slight blur  
  - Soft shadow  
- Typography:
  - High-tracking uppercase for labels  
  - Quiet, slightly italic for heritage/poetic lines  
- Accents use **Perazzi Red** sparingly (selection, calls to action).
- Colors and contrast adapt via CSS custom properties:
  - `--color-canvas`  
  - `--scrim-soft`  
  - `--scrim-strong`
- Tailwind classes like `bg-card`, `text-ink`, `text-ink-muted`, `border-border` map to theme semantics.

---

## 2. Section Shell (Full-Bleed Band)

**Pattern**

```tsx
<section
  className="relative isolate w-screen overflow-hidden py-16 sm:py-20"
  style={{
    marginLeft: "calc(50% - 50vw)",
    marginRight: "calc(50% - 50vw)",
  }}
>
  {/* content */}
</section>
```

**Rules**

- `w-screen` + `marginLeft/Right: calc(50% - 50vw)` break out of the normal layout to full viewport width.
- Vertical spacing for these “hero-ish” bands:
  - `py-16 sm:py-20`
- Always use `relative isolate` so background layers can sit behind the content via `-z-10`.

Use this wrapper for any cinematic full-width section that should visually match `ChampionsGallery`.

---

## 3. Background Treatment

The background is a **3-layer stack**:

1. Full-bleed image  
2. Soft scrim overlay  
3. Canvas-based gradient overlay for readability  

**Canonical Implementation**

```tsx
<div className="absolute inset-0 -z-10 overflow-hidden">
  <Image
    src="/redesign-photos/heritage/pweb-heritage-champions-bg.jpg"
    alt="Perazzi champions background"
    fill
    sizes="100vw"
    className="object-cover"
  />
  <div
    className="absolute inset-0 bg-(--scrim-soft)"
    aria-hidden
  />
  <div
    className="absolute inset-0"
    style={{
      backgroundImage:
        "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
        "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
        "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
    }}
    aria-hidden
  />
</div>
```

**Rules**

- **Background image:**
  - Use `<Image>` with `fill`, `sizes="100vw"`, `className="object-cover"`.
- **Soft scrim:**
  - Use `bg-[color:var(--scrim-soft)]` on a full-frame `div`.
- **Gradient overlay:**
  - Use the same `backgroundImage` string everywhere this pattern appears.
  - It must reference `var(--color-canvas)` and `color-mix(..)` so the gradient adjusts with light/dark theme.

---

## 4. Foreground Glass Container

Foreground content sits inside a centered, glass-like panel.

**Pattern**

```tsx
<div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
  <div className="space-y-6 rounded-3xl border border-border/70 bg-card/0 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-10">
    {/* content */}
  </div>
</div>
```

**Rules**

- **Outer wrapper:**
  - `relative z-10 mx-auto max-w-7xl`
  - Horizontal padding: `px-6 lg:px-10`
- **Glass panel:**
  - `rounded-3xl`
  - `border border-border/70`
  - `bg-card/0` (transparent base from card color)
  - `backdrop-blur-sm`
  - `shadow-lg`
  - Padding: `px-6 py-8 sm:px-10`
  - `space-y-6` for vertical rhythm

When restyling another component, this glass panel block is the main “house style” wrapper.

---

## 5. Typography System

### 5.1 Section Label + Subtitle

Used at the top of the glass panel.

```tsx
<p className="text-4xl font-black uppercase italic tracking-[0.35em] text-ink">
  Perazzi Champions
</p>
<h2 className="text-xl font-light italic text-ink-muted mb-10">
  The athletes who shaped our lineage
</h2>
```

**Rules**

- **Primary label:**
  - `text-4xl`
  - `font-black`
  - `uppercase`
  - `italic`
  - `tracking-[0.35em]`
  - `text-ink`
- **Subtitle:**
  - `text-xl`
  - `font-light`
  - `italic`
  - `text-ink-muted`
  - `mb-10` for separation from content below

Use this structure for section headers in heritage/brand-story components.

---

### 5.2 Micro Labels

Used for column titles and metadata labels.

```tsx
<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
  Champions
</p>
```

**Rules**

- `text-[11px]`
- `font-semibold`
- `uppercase`
- `tracking-[0.25em]` to `tracking-[0.3em]`
- `text-ink-muted`

Examples: “Champions”, “Disciplines”, “Platforms”, “Career Highlights”.

---

### 5.3 Body & Supporting Text

- Standard supporting copy:
  - `text-sm text-ink-muted`
- Primary body (slightly stronger):
  - `text-sm text-ink`

**Quotes**

```tsx
<blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-base italic text-ink">
  “Quote text…”
</blockquote>
```

**Quote rules**

- `border-l-2 border-perazzi-red/40`
- `pl-3`
- `text-base italic text-ink`

---

## 6. Filter Pills (Chips)

Used for discipline filters and similar segmented controls.

**Pattern**

```tsx
<button
  type="button"
  className={cn(
    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring transition",
    isActive
      ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
      : "border-ink/15 bg-card/0 text-ink hover:border-ink/60",
  )}
>
  Label
</button>
```

**Rules**

- Base classes:
  - `rounded-full border px-4 py-2`
  - `text-xs font-semibold uppercase tracking-[0.3em]`
  - `focus-ring transition`
- Active state:
  - `border-perazzi-red bg-perazzi-red/10 text-perazzi-red`
- Inactive state:
  - `border-ink/15 bg-card/0 text-ink`
  - `hover:border-ink/60`

Use this pill design for any filter/segmented control that should visually match the Champions gallery.

---

## 7. Layout: Two-Column Grid & Nested Cards

### 7.1 Two-Column Grid

```tsx
<div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
  {/* left / right */}
</div>
```

**Rules**

- Grid layout with:
  - `lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]`
  - This yields approx 40/60 split (list : detail).
- `gap-6` between columns.
- `mt-4` above the grid.

---

### 7.2 “Card in Card” – List Card

```tsx
<div className="rounded-3xl border border-border/70 bg-card/75 p-4">
  {/* label + list */}
</div>
```

### 7.3 “Card in Card” – Detail Card

```tsx
<div className="min-h-72 rounded-3xl border border-border/70 bg-card/75 p-5 shadow-sm">
  {/* animated content */}
</div>
```

**Rules**

- Inner cards (inside the main glass panel):
  - `rounded-3xl border border-border/70`
  - `bg-card/75` to feel more solid than the outer glass (`bg-card/0`)
- List card padding: `p-4`
- Detail card:
  - `min-h-[18rem]`
  - `p-5`
  - `shadow-sm` for light depth

Use this pattern whenever you nest cards inside the main glass container.

---

## 8. Selectable List Items

Pattern for list rows like the champion names.

```tsx
<button
  type="button"
  className={cn(
    "group w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors focus-ring",
    isActive
      ? "bg-ink text-card"
      : "bg-transparent text-ink-muted hover:bg-card hover:text-ink",
  )}
>
  <span className="block text-sm font-semibold tracking-wide">
    Primary line
  </span>
  <span className="mt-0.5 block text-[11px] uppercase tracking-[0.25em] text-ink-muted group-hover:text-ink-muted/90">
    Secondary line
  </span>
</button>
```

**Rules**

- Shape & layout:
  - `group w-full rounded-2xl px-3 py-2`
  - `text-left text-sm`
  - `transition-colors focus-ring`
- Active state:
  - `bg-ink text-card`
- Inactive state:
  - `bg-transparent text-ink-muted`
  - `hover:bg-card hover:text-ink`
- Typographic hierarchy:
  - Primary line: `text-sm font-semibold tracking-wide`
  - Secondary line:
    - `text-[11px] uppercase tracking-[0.25em] text-ink-muted`
    - Optional: `group-hover:text-ink-muted/90`

---

## 9. Detail Image Block

Used for champion portraits; can be reused for other “hero portrait” styles.

```tsx
<div
  className="relative overflow-hidden rounded-2xl bg-(--color-canvas)"
  style={{ aspectRatio: 3 / 2 }}
>
  <Image
    src={champion.image.url}
    alt={champion.image.alt}
    fill
    sizes="(min-width: 1024px) 320px, 100vw"
    className="object-cover"
  />
  <div
    className={cn(
      "pointer-events-none absolute inset-0 bg-linear-to-t",
      "from-(--scrim-strong)/80 via-(--scrim-strong)/50 to-transparent",
    )}
    aria-hidden
  />
</div>
```

**Rules**

- Aspect ratio:
  - `style={{ aspectRatio: 3 / 2 }}` (3:2)
- Container:
  - `relative overflow-hidden rounded-2xl`
  - `bg-[color:var(--color-canvas)]` as fallback/backdrop.
- Image:
  - `fill`
  - `className="object-cover"`
- Overlay:
  - `absolute inset-0 bg-gradient-to-t`
  - `from-[color:var(--scrim-strong)]/80`
  - `via-[color:var(--scrim-strong)]/50`
  - `to-transparent`
- Overlay is primarily for legibility if text is placed over the bottom of the image (now or later).

---

## 10. Metadata Chips (Disciplines / Platforms)

Pattern for small, bordered chips.

```tsx
<ul className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
  <li className="rounded-full border border-border px-3 py-1">
    Trap
  </li>
</ul>
```

**Rules**

- Container:
  - `flex flex-wrap gap-2`
  - `text-xs uppercase tracking-[0.2em] text-ink-muted`
- Each chip:
  - `rounded-full`
  - `border border-border`
  - `px-3 py-1`

Use for tag-like metadata: disciplines, platforms, formats, etc.

---

## 11. Motion & Transitions

The detail panel uses subtle Framer Motion transitions when swapping content.

```tsx
<motion.div
  key={selectedChampion.id}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.25, ease: "easeOut" }}
>
  {/* content */}
</motion.div>
```

**Rules**

- Entry:
  - `initial={{ opacity: 0, y: 8 }}`
  - `animate={{ opacity: 1, y: 0 }}`
- Exit:
  - `exit={{ opacity: 0, y: -8 }}`
- Timing:
  - `transition={{ duration: 0.25, ease: "easeOut" }}`
- Keep motion:
  - Subtle, linear-feeling
  - No scaling or rotation
  - No exaggerated overshoot

Use this motion grammar for swapping views inside a static shell (e.g., detail panels, tab content, etc.).

---

## 12. Copy-Paste Prompt Snippet (for AI / Codex)

When you want to restyle a component to match this pattern, you can include this snippet in a task card:

> **Restyle the target component to match the Heritage Glass Section pattern (as in `ChampionsGallery.tsx`):**
> - Wrap the section in a full-bleed band:
>   - Use a `section` with `className="relative isolate w-screen overflow-hidden py-16 sm:py-20"` and `style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}`.
> - Implement a three-layer background:
>   - Full-bleed `<Image>` (`fill`, `object-cover`).
>   - Scrim overlay `div` using `bg-[color:var(--scrim-soft)]`.
>   - Gradient overlay `div` using the `backgroundImage` gradient stack from this guide, based on `var(--color-canvas)` and `color-mix`.
> - Place all content inside a glass panel:
>   - Outer wrapper: `relative z-10 mx-auto max-w-7xl px-6 lg:px-10`.
>   - Inner glass: `rounded-3xl border border-border/70 bg-card/0 px-6 py-8 sm:px-10 shadow-lg backdrop-blur-sm`.
> - Use the typography hierarchy:
>   - Section label (4xl, black, uppercase, italic, wide tracking).
>   - Subtitle (xl, light, italic, muted).
>   - Micro labels (`text-[11px]`, uppercase, high tracking, `text-ink-muted`).
> - Use the pill design for filters:
>   - Base classes + active/inactive color rules defined in this document.
> - For nested cards, use `rounded-3xl border border-border/70 bg-card/75` with appropriate padding and optional `shadow-sm`.
> - Use the Framer Motion transition grammar (`opacity` + small `y` offset, 0.25s `easeOut`) for content swaps.