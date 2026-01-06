'use client'

import type {LogoProps, NavbarProps} from 'sanity'
import {perazziPalette} from './studioTheme'

export function StudioLogo(props: Readonly<LogoProps>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        color: perazziPalette.ink,
      }}
    >
      <span
        style={{
          backgroundColor: perazziPalette.red,
          color: perazziPalette.white,
          padding: '0.4rem 0.8rem',
          borderRadius: '999px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
        }}
      >
        Perazzi
      </span>
      <span
        style={{
          color: perazziPalette.black,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {props.title || 'Studio'}
      </span>
    </div>
  )
}

export function StudioNavbar(props: Readonly<NavbarProps>) {
  const {renderDefault} = props
  return (
    <div
      style={{
        background: perazziPalette.card,
        borderBottom: `1px solid ${perazziPalette.border}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}
    >
      {renderDefault(props)}
    </div>
  )
}
