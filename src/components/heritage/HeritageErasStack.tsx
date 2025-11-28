"use client";

import * as React from "react";
import type { HeritageEraWithEvents } from "@/types/heritage";
import { cn } from "@/lib/utils";
import { HeritageEraSection } from "./HeritageEraSection";

export type HeritageErasStackProps = {
  eras: HeritageEraWithEvents[];
  className?: string;
  registerEraRef?: (eraId: string, el: HTMLElement | null) => void;
  registerEraFocusRef?: (eraId: string, el: HTMLAnchorElement | null) => void;
  onActiveEventChange?: (eraId: string, eventIndex: number) => void;
  onEraInView?: (eraId: string, index: number) => void;
  onEraScrollProgress?: (eraId: string, index: number, progress: number) => void;
  prefersReducedMotion?: boolean;
  headerOffset?: number;
};

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
  if (!eras || eras.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
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
