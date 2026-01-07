"use client";

import {
  forwardRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  reveal: boolean;
  minHeightClass?: string;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
};

export const SectionShell = forwardRef<HTMLDivElement, SectionShellProps>(
  ({ reveal, minHeightClass, style, className, children }, ref) => {
    const resolvedMinHeightClass = minHeightClass ?? (reveal ? undefined : "min-h-[45vh]");

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "section-reveal-shell relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
          reveal
            ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
            : "border-transparent bg-transparent shadow-none backdrop-blur-none",
          resolvedMinHeightClass,
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

SectionShell.displayName = "SectionShell";
