"use client";

import Image from "next/image";
import { useParallaxBackground } from "@/hooks/use-parallax-background";
import { cn } from "@/lib/utils";

type OverlayVariant = "canvas" | "canvas-80" | "ink" | "ink-50" | "none";

const overlayClasses: Record<Exclude<OverlayVariant, "none">, string> = {
  canvas: "overlay-gradient-canvas",
  "canvas-80": "overlay-gradient-canvas-80",
  ink: "overlay-gradient-ink",
  "ink-50": "overlay-gradient-ink-50",
};

type SectionBackdropProps = Readonly<{
  image: { url: string; alt?: string };
  reveal: boolean;
  revealOverlay?: boolean;
  preparing?: boolean;
  enableParallax: boolean;
  overlay?: OverlayVariant;
  priority?: boolean;
  loading?: "eager" | "lazy";
  sizes?: string;
}>;

export function SectionBackdrop({
  image,
  reveal,
  revealOverlay,
  preparing = false,
  enableParallax,
  overlay = "canvas",
  priority = false,
  loading,
  sizes = "100vw",
}: SectionBackdropProps) {
  const parallaxRef = useParallaxBackground(enableParallax);
  const overlayVisible = revealOverlay ?? reveal;
  const overlayActive = overlayVisible || preparing;
  const overlayClass = overlay === "none" ? null : overlayClasses[overlay];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div ref={parallaxRef} className="absolute inset-x-0 parallax-image">
        <div className="absolute inset-0 section-backdrop-media">
          <Image
            src={image.url}
            alt={image.alt ?? ""}
            fill
            sizes={sizes}
            className="object-cover"
            priority={priority}
            loading={loading}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      {overlayClass ? (
        <div
          className={cn(
            "section-backdrop-overlay pointer-events-none absolute inset-0",
            overlayClass,
            overlayActive ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
