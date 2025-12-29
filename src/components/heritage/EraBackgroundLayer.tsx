"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type EraBackgroundLayerProps = Readonly<{
  src: string;
  overlayColor: string;
  alt?: string;
  className?: string;
}>;

export function EraBackgroundLayer({
  src,
  overlayColor,
  alt = "",
  className,
}: EraBackgroundLayerProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={false}
          loading="lazy"
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0">
        <div
          className="absolute inset-0 overlay-dynamic"
          style={{
            "--overlay-color": overlayColor,
          }}
        />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-30" />
      </div>
    </div>
  );
}
