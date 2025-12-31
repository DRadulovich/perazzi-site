"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PerazziHeritageErasProps } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { HeritageErasStack } from "./HeritageErasStack";

export function PerazziHeritageEras({
  eras,
  className,
  sectionId,
}: Readonly<PerazziHeritageErasProps>) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const analyticsRef = useAnalyticsObserver<HTMLElement>("PerazziHeritageErasSeen");

  if (!eras || eras.length === 0) {
    return null;
  }

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PerazziHeritageErasSeen"
      id={sectionId}
      className={cn("relative w-screen max-w-[100vw] min-h-screen full-bleed", className)}
      aria-label="Perazzi heritage eras"
    >
      <HeritageErasStack
        eras={eras}
        prefersReducedMotion={prefersReducedMotion}
      />
    </section>
  );
}
