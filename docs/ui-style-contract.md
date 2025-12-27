# UI Style Contract (Site UI)

Purpose: Keep the site UI high-end and consistent by enforcing one set of
tokens, primitives, and interaction patterns. This does not apply to Studio.

## Source of truth
- Tokens and theming live in `src/app/globals.css` (CSS variables + Tailwind @theme).
- Theme switching uses `data-theme` on a container or ThemeProvider.
- `src/lib/tokens.ts` is not the UI source of truth.

## Official primitives (src/components/ui)
- Button, Input, Textarea
- Heading, Text
- Section, Container
- Dialog, Popover, Collapsible, Tooltip
- VisuallyHidden

Notes:
- Use these for all site UI. Hero sections may be bespoke, but should still
  consume tokens and core primitives where possible.

## Typography
- Default typography uses `Heading` and `Text`.
- Long-form uses `.prose` with tokenized colors in `globals.css`.
- Bespoke hero typography is allowed only in hero sections.

## Motion
- Framer Motion is used for hero/scroll choreography.
- UI transitions use subtle CSS transitions (160-220ms ease-out).

## Overlay standard (Dialogs and Popovers)
- Overlay: `bg-black/50` + `backdrop-blur-sm`.
- Content: `bg-card/95`, `ring-1 ring-border/70`, `shadow-elevated`,
  `rounded-3xl`, `backdrop-blur-xl`.
- Animation: fade + subtle scale (or small translate), 160-220ms ease-out.

## Radius scale (premium)
- `rounded-xl` = 8px
- `rounded-2xl` = 12px
- `rounded-3xl` = 16px
- No ad-hoc `rounded-[...]` in site UI.
- Avoid `rounded-sm/md/lg` for site UI (use the premium scale; `rounded-full` is OK for pills).

## Shadow scale (premium)
- `shadow-soft`: 0 6px 18px rgba(0,0,0,0.08)
- `shadow-medium`: 0 12px 32px rgba(0,0,0,0.14)
- `shadow-elevated`: 0 20px 60px rgba(0,0,0,0.15)
- Use the premium shadow scale (avoid `shadow-sm/md/lg/xl/2xl`).
- No ad-hoc `shadow-[...]` in site UI.

## Icons
- `lucide-react` is the single icon set for site UI.

## Rich text
- CMS content: Portable Text.
- Legacy HTML: `SafeHtml` only until migrated.
- Markdown: chat/assistant only.

## Migration rule
- If a one-off can be represented by a primitive, migrate it.
