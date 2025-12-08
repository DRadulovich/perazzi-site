"use client";

import * as React from "react";
import type { HeritageEraWithEvents } from "@/types/heritage";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { HeritageEraSection } from "./HeritageEraSection";

export type HeritageErasStackProps = Readonly<{
  readonly eras: readonly HeritageEraWithEvents[];
  readonly className?: string;
  readonly registerEraRef?: (eraId: string, el: HTMLElement | null) => void;
  readonly registerEraFocusRef?: (
    eraId: string,
    el: HTMLAnchorElement | null
  ) => void;
  readonly onActiveEventChange?: (eraId: string, eventIndex: number) => void;
  readonly onEraInView?: (eraId: string, index: number) => void;
  readonly onEraScrollProgress?: (
    eraId: string,
    index: number,
    progress: number
  ) => void;
  readonly prefersReducedMotion?: boolean;
  readonly headerOffset?: number;
}>;

function HeritageErasStackBase({
  eras,
  className,
  registerEraRef,
  registerEraFocusRef,
  onActiveEventChange,
  onEraInView,
  onEraScrollProgress,
  prefersReducedMotion,
  headerOffset,
}: HeritageErasStackProps) {
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>("HeritageErasStackSeen");

  if (!eras || eras.length === 0) return null;

  return (
    <div
      ref={analyticsRef}
      data-analytics-id="HeritageErasStackSeen"
      className={cn("relative", className)}
    >
      {eras.map((era, index) => (
        <HeritageEraSection
          key={era.id}
          era={era}
          index={index}
          registerEraRef={registerEraRef}
          registerEraFocusRef={registerEraFocusRef}
          onActiveEventChange={onActiveEventChange}
          onEraInView={onEraInView}
          onEraScrollProgress={onEraScrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          headerOffset={headerOffset}
        />
      ))}
    </div>
  );
}

export const HeritageErasStack = React.memo(HeritageErasStackBase);
HeritageErasStack.displayName = "HeritageErasStack";
