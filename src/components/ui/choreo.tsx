"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  buildChoreoGroupVars,
  buildChoreoItemVars,
  choreoPresence,
  choreoDurations,
  choreoEase,
  choreoStagger,
  type ChoreoAxis,
  type ChoreoDirection,
  type ChoreoEffect,
  type ChoreoPresenceState,
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
  readonly maskFeather?: number;
  readonly scaleFrom?: number;
  readonly className?: string;
  readonly itemClassName?: string;
  readonly itemStyle?: CSSProperties;
  readonly itemAsChild?: boolean;
};

type ChoreoPresenceProps = HTMLAttributes<HTMLElement> & {
  readonly children: ReactNode;
  readonly state: ChoreoPresenceState;
  readonly asChild?: boolean;
};

export function ChoreoPresence({
  children,
  state,
  asChild = false,
  className,
  style,
  ...props
}: ChoreoPresenceProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      {...choreoPresence(state)}
      className={cn("choreo-presence", className)}
      style={style}
      {...props}
    >
      {children}
    </Comp>
  );
}

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
  maskFeather,
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
          maskFeather,
          scaleFrom,
        });
        const childStyle = itemAsChild && isValidElement(child)
          ? (child.props as { style?: CSSProperties }).style
          : undefined;
        const mergedStyle = { ...childStyle, ...itemVars, ...itemStyle };

        const key = isValidElement(child) && child.key !== null ? child.key : index;

        return (
          <RevealItem
            key={key}
            index={index}
            asChild={itemAsChild}
            className={cn("choreo-item", `choreo-${effect}`, itemClassName)}
            style={mergedStyle}
          >
            {child}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
