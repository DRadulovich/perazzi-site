"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ERA_CANVAS_OVERLAY_GRADIENT =
  "linear-gradient(to right, color-mix(in srgb, var(--color-black) 0%, transparent) 0%, color-mix(in srgb, var(--color-black) 0%, transparent) 0%, color-mix(in srgb, var(--color-black) 0%, transparent) 0%), " +
  "linear-gradient(to bottom, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 30%), " +
  "linear-gradient(to top, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 30%)";

export type EraBackgroundLayerProps = {
  src: string;
  overlayColor: string;
  alt?: string;
  className?: string;
};

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
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: overlayColor,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: ERA_CANVAS_OVERLAY_GRADIENT,
          }}
        />
      </div>
    </div>
  );
}
