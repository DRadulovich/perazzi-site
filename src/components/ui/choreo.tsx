"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useState,
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
  readonly disableMask?: boolean;
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
  disableMask = false,
  className,
  itemClassName,
  itemStyle,
  itemAsChild = false,
}: ChoreoGroupProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const groupVars = buildChoreoGroupVars({
    delayMs,
    durationMs,
    staggerMs,
    easing,
  });

  const childArray = Children.toArray(children);
  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) {
        setIsAnimating(true);
      }
    });
    const childCount = childArray.length;
    const totalDuration = delayMs + durationMs + Math.max(0, (childCount - 1) * staggerMs) + 120;
    const timer = globalThis.setTimeout(() => {
      if (isActive) {
        setIsAnimating(false);
      }
    }, totalDuration);
    return () => {
      isActive = false;
      globalThis.clearTimeout(timer);
    };
  }, [delayMs, durationMs, staggerMs, childArray.length]);

  return (
    <RevealGroup
      delayMs={delayMs}
      durationMs={durationMs}
      staggerMs={staggerMs}
      easing={easing}
      className={cn("choreo-group", disableMask && "choreo-mask-none", className)}
      style={groupVars}
      data-choreo-animating={isAnimating ? "true" : "false"}
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
