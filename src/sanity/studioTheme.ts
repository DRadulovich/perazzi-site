'use client'

import {
  buildTheme,
  type ColorConfigValue,
  type ThemeColorTokenValue,
} from '@sanity/ui/theme'

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

const fontFamilyBase =
  'var(--font-geist-sans), "Inter", "Segoe UI", system-ui, sans-serif'
const fontFamilyMono =
  'var(--font-geist-mono), "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

const token = (
  light: ColorConfigValue,
  dark: ColorConfigValue = light
): ThemeColorTokenValue => [light, dark]

const baseTheme = buildTheme()
const perazziFonts = {
  ...baseTheme.v2!.font,
  code: {...baseTheme.v2!.font.code, family: fontFamilyMono},
  heading: {...baseTheme.v2!.font.heading, family: fontFamilyBase},
  label: {...baseTheme.v2!.font.label, family: fontFamilyBase},
  text: {...baseTheme.v2!.font.text, family: fontFamilyBase},
}

// Align Studio theming with site brand tokens (Perazzi red / black on warm canvas)
export const perazziTheme = buildTheme({
  color: {
    base: {
      '*': {
        focusRing: token('red/600'),
        link: {fg: token('red/600', 'red/500')},
      },
      primary: {_hue: 'red'},
    },
  },
  font: perazziFonts,
})
