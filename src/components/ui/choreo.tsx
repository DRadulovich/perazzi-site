"use client";

import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  buildChoreoGroupVars,
  buildChoreoItemVars,
  choreoDurations,
  choreoEase,
  choreoStagger,
  type ChoreoAxis,
  type ChoreoDirection,
  type ChoreoEffect,
} from "@/lib/choreo";
import { RevealGroup, RevealItem } from "./section-reveal";

type ChoreoGroupProps = {
  readonly children: ReactNode;
  readonly effect?: ChoreoEffect;
  readonly delayMs?: number;
  readonly durationMs?: number;
  readonly staggerMs?: number;
  readonly easing?: string;
  readonly distance?: number;
  readonly axis?: ChoreoAxis;
  readonly direction?: ChoreoDirection;
  readonly maskDirection?: ChoreoDirection;
  readonly scaleFrom?: number;
  readonly className?: string;
  readonly itemClassName?: string;
  readonly itemStyle?: CSSProperties;
  readonly itemAsChild?: boolean;
};

export function ChoreoGroup({
  children,
  effect = "fade-lift",
  delayMs = 0,
  durationMs = choreoDurations.base,
  staggerMs = choreoStagger.base,
  easing = choreoEase,
  distance,
  axis = "x",
  direction,
  maskDirection,
  scaleFrom,
  className,
  itemClassName,
  itemStyle,
  itemAsChild = false,
}: ChoreoGroupProps) {
  const groupVars = buildChoreoGroupVars({
    delayMs,
    durationMs,
    staggerMs,
    easing,
  });

  const childArray = Children.toArray(children);

  return (
    <RevealGroup
      delayMs={delayMs}
      durationMs={durationMs}
      staggerMs={staggerMs}
      easing={easing}
      className={cn("choreo-group", className)}
      style={groupVars}
    >
      {childArray.map((child, index) => {
        const itemVars = buildChoreoItemVars(effect, {
          index,
          distance,
          axis,
          direction,
          maskDirection,
          scaleFrom,
        });

        const key = isValidElement(child) && child.key !== null ? child.key : index;

        return (
          <RevealItem
            key={key}
            index={index}
            asChild={itemAsChild}
            className={cn("choreo-item", `choreo-${effect}`, itemClassName)}
            style={{ ...itemVars, ...itemStyle }}
          >
            {child}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
