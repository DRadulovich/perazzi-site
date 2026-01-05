import type { CSSProperties } from "react";

export const choreoDurations = {
  short: 180,
  base: 320,
  long: 520,
} as const;

export const choreoStagger = {
  tight: 70,
  base: 90,
  wide: 110,
} as const;

export const choreoEase = "cubic-bezier(0.22, 1, 0.36, 1)" as const;

export type ChoreoEffect = "fade-lift" | "slide" | "scale-parallax" | "mask-wipe";
export type ChoreoDirection = "up" | "down" | "left" | "right";
export type ChoreoAxis = "x" | "y";

type ChoreoGroupVarsOptions = {
  delayMs?: number;
  durationMs?: number;
  staggerMs?: number;
  easing?: string;
};

type ChoreoItemVarsOptions = {
  index?: number;
  distance?: number;
  axis?: ChoreoAxis;
  direction?: ChoreoDirection;
  scaleFrom?: number;
  maskDirection?: ChoreoDirection;
};

export const choreoTokens = {
  durations: choreoDurations,
  stagger: choreoStagger,
  ease: choreoEase,
};

export const prefersReducedMotion = (): boolean => {
  const query = typeof globalThis === "undefined"
    ? null
    : globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  return query?.matches ?? false;
};

export const choreoPresence = (state: "enter" | "exit") =>
  ({ "data-choreo-presence": state }) as const;

export const buildChoreoGroupVars = ({
  delayMs = 0,
  durationMs = choreoDurations.base,
  staggerMs = choreoStagger.base,
  easing = choreoEase,
}: ChoreoGroupVarsOptions = {}): CSSProperties => ({
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

export const buildChoreoItemVars = (
  effect: ChoreoEffect,
  {
    index = 0,
    distance = 14,
    axis = "x",
    direction,
    scaleFrom = 1.04,
    maskDirection = "up",
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
      vars["--choreo-mask-from"] = maskInsetFromDirection(maskDirection);
      vars["--choreo-translate-x"] = "0px";
      vars["--choreo-translate-y"] = `${Math.max(4, distance / 2)}px`;
      break;
    }
    default:
      break;
  }

  return vars as CSSProperties;
};
