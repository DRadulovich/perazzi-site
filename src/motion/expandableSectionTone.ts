"use client";

import type { Variants } from "framer-motion";

type GlassToneOptions = {
  backgroundVar?: string;
  borderVar?: string;
  backgroundStrength: number;
  borderStrength: number;
  blurPx: number;
  shadow: "soft" | "elevated" | "none";
};

const mixAlpha = (varName: string, percent: number) =>
  `color-mix(in oklab, var(${varName}) ${percent}%, transparent)`;

const mixBetween = (foregroundVar: string, backgroundVar: string, percent: number) =>
  `color-mix(in oklab, var(${foregroundVar}) ${percent}%, var(${backgroundVar}))`;

const shadowSoft =
  "0 0 0 1px rgba(0, 0, 0, 0.04), 0 0 6px rgba(0, 0, 0, 0.16), 0 0 18px rgba(0, 0, 0, 0.14)";
const shadowSoftTransparent =
  "0 0 0 1px rgba(0, 0, 0, 0), 0 0 6px rgba(0, 0, 0, 0), 0 0 18px rgba(0, 0, 0, 0)";
const shadowElevated =
  "0 0 0 1px rgba(0, 0, 0, 0.06), 0 0 20px rgba(0, 0, 0, 0.22), 0 0 60px rgba(0, 0, 0, 0.18)";
const shadowElevatedTransparent =
  "0 0 0 1px rgba(0, 0, 0, 0), 0 0 20px rgba(0, 0, 0, 0), 0 0 60px rgba(0, 0, 0, 0)";

const getShadowPair = (shadow: GlassToneOptions["shadow"]) => {
  if (shadow === "elevated") {
    return { expanded: shadowElevated, collapsed: shadowElevatedTransparent };
  }
  if (shadow === "none") {
    return { expanded: shadowSoftTransparent, collapsed: shadowSoftTransparent };
  }
  return { expanded: shadowSoft, collapsed: shadowSoftTransparent };
};

export const buildGlassToneVariants = ({
  backgroundVar = "--color-card",
  borderVar = "--color-border",
  backgroundStrength,
  borderStrength,
  blurPx,
  shadow,
}: GlassToneOptions): Variants => {
  const shadowPair = getShadowPair(shadow);
  const collapsed = {
    backgroundColor: mixAlpha(backgroundVar, 0),
    borderColor: mixAlpha(borderVar, 0),
    boxShadow: shadowPair.collapsed,
    backdropFilter: "blur(0px)",
  };
  const expanded = {
    backgroundColor: mixAlpha(backgroundVar, backgroundStrength),
    borderColor: mixAlpha(borderVar, borderStrength),
    boxShadow: shadowPair.expanded,
    backdropFilter: `blur(${blurPx}px)`,
  };

  return {
    collapsed,
    prezoom: collapsed,
    expanded,
    closingHold: expanded,
  };
};

export const buildTitleToneVariants = (
  toneVar: string,
  baseVar = "--color-white",
): Variants => {
  const collapsed = { color: mixBetween(toneVar, baseVar, 0) };
  const expanded = { color: mixBetween(toneVar, baseVar, 100) };
  return {
    collapsed,
    prezoom: collapsed,
    expanded,
    closingHold: expanded,
  };
};

export const mergeVariants = (base: Variants, tone: Variants): Variants => ({
  collapsed: { ...base.collapsed, ...tone.collapsed },
  prezoom: { ...base.prezoom, ...tone.prezoom },
  expanded: { ...base.expanded, ...tone.expanded },
  closingHold: { ...base.closingHold, ...tone.closingHold },
});
