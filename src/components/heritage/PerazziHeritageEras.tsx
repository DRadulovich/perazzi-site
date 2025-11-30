"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PerazziHeritageErasProps } from "@/types/heritage";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { HeritageErasStack } from "./HeritageErasStack";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

export function PerazziHeritageEras({ eras, className }: PerazziHeritageErasProps) {
  if (!eras || eras.length === 0) {
    return null;
  }

  const prefersReducedMotion = usePrefersReducedMotion();
  const analyticsRef = useAnalyticsObserver<HTMLElement>("PerazziHeritageErasSeen");

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="PerazziHeritageErasSeen"
      className={cn("relative w-screen max-w-[100vw] min-h-screen", className)}
      aria-label="Perazzi heritage eras"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <HeritageErasStack
        eras={eras}
        prefersReducedMotion={prefersReducedMotion}
      />
    </section>
  );
}
