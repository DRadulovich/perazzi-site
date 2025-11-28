"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export type EraBackgroundLayerProps = {
  src: string;
  overlayColor: string;
  alt?: string;
  className?: string;
  scrollProgress?: MotionValue<number>;
};

export function EraBackgroundLayer({
  src,
  overlayColor,
  alt = "",
  className,
  scrollProgress,
}: EraBackgroundLayerProps) {
  const translateY = scrollProgress ? useTransform(scrollProgress, [0, 1], [-10, 10]) : undefined;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0"
        style={translateY ? { y: translateY } : undefined}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={false}
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: overlayColor,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_black/45_100%)]" />
      </div>
    </div>
  );
}
