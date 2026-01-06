import type { CSSProperties } from "react";

type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string | number>;

export const choreoDurations = {
  micro: 120,
  short: 180,
  base: 320,
  long: 520,
} as const;

export const choreoStagger = {
  tight: 70,
  base: 90,
  wide: 110,
} as const;

export const choreoDistance = {
  tight: 8,
  base: 12,
  wide: 18,
} as const;

export const choreoEaseOut = "cubic-bezier(0.22, 1, 0.36, 1)" as const;
export const choreoEaseIn = "cubic-bezier(0.4, 0, 1, 1)" as const;
export const choreoEaseHero = "cubic-bezier(0.16, 1, 0.3, 1)" as const;
export const choreoEase = choreoEaseOut;

export type ChoreoEffect = "fade-lift" | "slide" | "scale-parallax" | "mask-wipe";
export type ChoreoDirection = "up" | "down" | "left" | "right";
export type ChoreoAxis = "x" | "y";
export type ChoreoPresenceState = "enter" | "exit";

export type ChoreoGroupVarsOptions = {
  delayMs?: number;
  durationMs?: number;
  staggerMs?: number;
  easing?: string;
};

export type ChoreoItemVarsOptions = {
  index?: number;
  distance?: number;
  axis?: ChoreoAxis;
  direction?: ChoreoDirection;
  scaleFrom?: number;
  maskDirection?: ChoreoDirection;
  maskFeather?: number;
};

export type ChoreoPresenceVarsOptions = {
  enterDurationMs?: number;
  exitDurationMs?: number;
  enterEase?: string;
  exitEase?: string;
  enterY?: number;
  exitY?: number;
  enterScale?: number;
  exitScale?: number;
  enterBlur?: number;
  exitBlur?: number;
};

export const dreamyPace = {
  enterMs: 3600,
  textMs: 3000,
  lineMs: 2800,
  staggerMs: 420,
  staggerSpan: 0.7,
  easing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
} as const;

export const choreoTokens = {
  durations: choreoDurations,
  distance: choreoDistance,
  stagger: choreoStagger,
  ease: choreoEase,
  easeIn: choreoEaseIn,
  easeOut: choreoEaseOut,
  easeHero: choreoEaseHero,
  dreamyPace,
};

export const prefersReducedMotion = (): boolean => {
  const query = typeof globalThis === "undefined"
    ? null
    : globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  return query?.matches ?? false;
};

export const choreoPresence = (state: ChoreoPresenceState) =>
  ({ "data-choreo-presence": state }) as const;

export const buildChoreoPresenceVars = ({
  enterDurationMs = 260,
  exitDurationMs = choreoDurations.short,
  enterEase = choreoEaseOut,
  exitEase = choreoEaseIn,
  enterY = 12,
  exitY = 8,
  enterScale = 1,
  exitScale = 1,
  enterBlur = 0,
  exitBlur = 0,
}: ChoreoPresenceVarsOptions = {}): CSSPropertiesWithVars => ({
  "--choreo-presence-enter-duration": `${enterDurationMs}ms`,
  "--choreo-presence-exit-duration": `${exitDurationMs}ms`,
  "--choreo-presence-enter-ease": enterEase,
  "--choreo-presence-exit-ease": exitEase,
  "--choreo-presence-enter-y": `${enterY}px`,
  "--choreo-presence-exit-y": `${exitY}px`,
  "--choreo-presence-enter-scale": enterScale,
  "--choreo-presence-exit-scale": exitScale,
  "--choreo-presence-enter-blur": `${enterBlur}px`,
  "--choreo-presence-exit-blur": `${exitBlur}px`,
});

export const buildChoreoGroupVars = ({
  delayMs = 0,
  durationMs = choreoDurations.base,
  staggerMs = choreoStagger.base,
  easing = choreoEase,
}: ChoreoGroupVarsOptions = {}): CSSPropertiesWithVars => ({
  "--choreo-delay": `${delayMs}ms`,
  "--choreo-duration": `${durationMs}ms`,
  "--choreo-stagger": `${staggerMs}ms`,
  "--choreo-ease": easing,
});

const resolveSlideOffsets = (
  axis: ChoreoAxis,
  direction: ChoreoDirection,
  distance: number,
) => {
  const offset = `${distance}px`;
  if (axis === "x") {
    return { x: direction === "left" ? `-${offset}` : offset, y: "0px" };
  }
  return { x: "0px", y: direction === "up" ? offset : `-${offset}` };
};

const maskInsetFromDirection = (direction: ChoreoDirection) => {
  switch (direction) {
    case "left":
      return "inset(0 100% 0 0)";
    case "right":
      return "inset(0 0 0 100%)";
    case "down":
      return "inset(100% 0 0 0)";
    case "up":
    default:
      return "inset(0 0 100% 0)";
  }
};

const maskGradientFromDirection = (direction: ChoreoDirection) => {
  switch (direction) {
    case "left":
      return {
        direction: "to right",
        size: "200% 100%",
        from: "100% 0%",
        to: "0% 0%",
      };
    case "right":
      return {
        direction: "to left",
        size: "200% 100%",
        from: "100% 0%",
        to: "0% 0%",
      };
    case "down":
      return {
        direction: "to top",
        size: "100% 200%",
        from: "0% 100%",
        to: "0% 0%",
      };
    case "up":
    default:
      return {
        direction: "to bottom",
        size: "100% 200%",
        from: "0% 100%",
        to: "0% 0%",
      };
  }
};

export const buildChoreoItemVars = (
  effect: ChoreoEffect,
  {
    index = 0,
    distance = choreoDistance.base,
    axis = "x",
    direction,
    scaleFrom = 1.04,
    maskDirection = "up",
    maskFeather,
  }: ChoreoItemVarsOptions = {},
): CSSProperties => {
  const vars: Record<string, string | number> = {
    "--choreo-index": index,
    "--choreo-distance": `${distance}px`,
  };

  switch (effect) {
    case "fade-lift": {
      const resolvedDirection = direction ?? "up";
      const translateY = resolvedDirection === "down" ? `-${distance}px` : `${distance}px`;
      vars["--choreo-translate-x"] = "0px";
      vars["--choreo-translate-y"] = translateY;
      break;
    }
    case "slide": {
      const resolvedDirection: ChoreoDirection =
        direction ?? (axis === "y" ? "up" : "right");
      const { x, y } = resolveSlideOffsets(axis, resolvedDirection, distance);
      vars["--choreo-translate-x"] = x;
      vars["--choreo-translate-y"] = y;
      break;
    }
    case "scale-parallax": {
      vars["--choreo-scale-from"] = scaleFrom;
      vars["--choreo-translate-x"] = "0px";
      vars["--choreo-translate-y"] = `${distance / 2}px`;
      break;
    }
    case "mask-wipe": {
      const gradient = maskGradientFromDirection(maskDirection);
      vars["--choreo-mask-from"] = maskInsetFromDirection(maskDirection);
      vars["--choreo-mask-to"] = "inset(0 0 0 0)";
      vars["--choreo-mask-direction"] = gradient.direction;
      vars["--choreo-mask-size"] = gradient.size;
      vars["--choreo-mask-position-from"] = gradient.from;
      vars["--choreo-mask-position-to"] = gradient.to;
      if (typeof maskFeather === "number") {
        vars["--choreo-mask-feather"] = `${maskFeather}%`;
      }
      vars["--choreo-translate-x"] = "0px";
      vars["--choreo-translate-y"] = `${Math.max(4, distance / 2)}px`;
      break;
    }
    default:
      break;
  }

  return vars as CSSProperties;
};

export const choreoFadeLift = (options?: ChoreoItemVarsOptions) =>
  buildChoreoItemVars("fade-lift", options);

export const choreoSlide = (options?: ChoreoItemVarsOptions) =>
  buildChoreoItemVars("slide", options);

export const choreoScaleParallax = (options?: ChoreoItemVarsOptions) =>
  buildChoreoItemVars("scale-parallax", options);

export const choreoMaskWipe = (options?: ChoreoItemVarsOptions) =>
  buildChoreoItemVars("mask-wipe", options);
