'use client'

import {buildLegacyTheme} from 'sanity'

export const perazziPalette = {
  red: '#DB1022',
  black: '#0F0F10', // dark workshop canvas
  white: '#FFFFFF',
  canvas: '#0F0F10',
  card: '#141415',
  elevated: '#1A1A1B',
  ink: '#F5F5F5',
  inkMuted: '#B9B9B9',
  border: '#2A2A2B',
}

// Align Studio theming with site brand tokens (Perazzi red / black on warm canvas)
export const perazziTheme = buildLegacyTheme({
  '--font-family-base': 'var(--font-geist-sans), "Inter", "Segoe UI", system-ui, sans-serif',
  '--font-family-monospace':
    'var(--font-geist-mono), "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  '--black': perazziPalette.black,
  '--white': perazziPalette.white,
  '--gray-base': perazziPalette.black,
  '--gray': perazziPalette.inkMuted,
  '--brand-primary': perazziPalette.red,
  '--focus-color': perazziPalette.red,
  '--component-bg': perazziPalette.card,
  '--component-text-color': perazziPalette.ink,
  '--card-border-color': perazziPalette.border,
  '--input-bg': perazziPalette.elevated,
  '--input-border-color': perazziPalette.border,
  '--input-border-color-hover': perazziPalette.border,
  '--input-border-color-focus': perazziPalette.red,
  '--input-text-color': perazziPalette.ink,
  '--input-placeholder-color': perazziPalette.inkMuted,
  '--default-button-color': perazziPalette.black,
  '--default-button-text-color': perazziPalette.white,
  '--default-button-primary-color': perazziPalette.red,
  '--default-button-success-color': perazziPalette.card,
  '--default-button-warning-color': '#a15708',
  '--default-button-danger-color': perazziPalette.red,
  '--state-info-color': perazziPalette.red,
  '--state-success-color': perazziPalette.card,
  '--state-warning-color': '#a15708',
  '--state-danger-color': perazziPalette.red,
  '--main-navigation-color': perazziPalette.card,
  '--main-navigation-color--inverted': perazziPalette.ink,
})
