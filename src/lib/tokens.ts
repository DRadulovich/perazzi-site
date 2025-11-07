export const colors = {
  perazziRed: "#9c1f2b",
  perazziWhite: "#fffdfa",
  perazziBlack: "#120d0a",
  ink: "#1b120b",
  inkMuted: "#645247",
  border: "#e2d7ce",
  focus: "#0d62ff",
} as const;

export const spacing = {
  "3xs": "0.25rem",
  "2xs": "0.375rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const fonts = {
  sans:
    'var(--font-geist-sans), "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  serif: '"Playfair Display", "Georgia", serif',
  mono:
    'var(--font-geist-mono), "IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
} as const;

export type BrandColor = keyof typeof colors;
export type BrandSpacing = keyof typeof spacing;
