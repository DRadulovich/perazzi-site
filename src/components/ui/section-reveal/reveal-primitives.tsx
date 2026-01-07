"use client";

import { Slot } from "@radix-ui/react-slot";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealAnimatedBodyProps = Readonly<{
  children: ReactNode;
  sequence?: boolean;
  delayMs?: number;
  staggerMs?: number;
  durationMs?: number;
  easing?: string;
  className?: string;
}>;

export function RevealAnimatedBody({
  children,
  sequence = false,
  delayMs = 0,
  staggerMs = 160,
  durationMs = 900,
  easing = "cubic-bezier(0.2, 0.9, 0.2, 1)",
  className,
}: RevealAnimatedBodyProps) {
  const style = sequence
    ? ({
        "--reveal-delay": `${delayMs}ms`,
        "--reveal-stagger": `${staggerMs}ms`,
        "--reveal-duration": `${durationMs}ms`,
        "--reveal-ease": easing,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={cn("section-reveal-body", className)}
      data-reveal-sequence={sequence ? "true" : undefined}
      style={style}
    >
      {children}
    </div>
  );
}

type RevealItemProps = Readonly<{
  children: ReactNode;
  index?: number;
  className?: string;
  style?: CSSProperties;
  asChild?: boolean;
}>;

export function RevealItem({
  children,
  index,
  className,
  style = {},
  asChild = false,
}: RevealItemProps) {
  const Comp = asChild ? Slot : "div";
  const resolvedStyle = { ...style } as CSSProperties;

  if (typeof index === "number") {
    (resolvedStyle as Record<string, string | number>)["--reveal-index"] = index;
  }

  return (
    <Comp data-reveal-item className={className} style={resolvedStyle}>
      {children}
    </Comp>
  );
}

type RevealGroupProps = Readonly<{
  children: ReactNode;
  delayMs?: number;
  staggerMs?: number;
  durationMs?: number;
  easing?: string;
  className?: string;
  style?: CSSProperties;
  asChild?: boolean;
}>;

export function RevealGroup({
  children,
  delayMs,
  staggerMs,
  durationMs,
  easing,
  className,
  style = {},
  asChild = false,
}: RevealGroupProps) {
  const Comp = asChild ? Slot : "div";
  const resolvedStyle = { ...style } as CSSProperties;

  if (typeof delayMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-delay"] = `${delayMs}ms`;
  }

  if (typeof staggerMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-stagger"] = `${staggerMs}ms`;
  }

  if (typeof durationMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-duration"] = `${durationMs}ms`;
  }

  if (typeof easing === "string" && easing.length > 0) {
    (resolvedStyle as Record<string, string>)["--reveal-ease"] = easing;
  }

  return (
    <Comp data-reveal-group className={className} style={resolvedStyle}>
      {children}
    </Comp>
  );
}
