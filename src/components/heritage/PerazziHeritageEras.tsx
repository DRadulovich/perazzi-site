"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PerazziHeritageErasProps } from "@/types/heritage";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { HeritageErasStack } from "./HeritageErasStack";

export function PerazziHeritageEras({ eras, className }: PerazziHeritageErasProps) {
  if (!eras || eras.length === 0) {
    return null;
  }

  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section
      className={cn("relative w-full min-h-screen", className)}
      aria-label="Perazzi heritage eras"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      <HeritageErasStack
        eras={eras}
        prefersReducedMotion={prefersReducedMotion}
      />
    </section>
  );
}
