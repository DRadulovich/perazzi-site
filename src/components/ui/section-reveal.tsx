"use client";

import Image from "next/image";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useParallaxBackground } from "@/hooks/use-parallax-background";
import { cn } from "@/lib/utils";
import { Heading } from "./heading";
import { Text } from "./text";

type RevealHeightOptions = {
  enabled: boolean;
  deps?: readonly unknown[];
};

export const useRevealHeight = ({ enabled, deps = [] }: RevealHeightOptions) => {
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enabled, deps]);

  const minHeightStyle: CSSProperties | undefined =
    enabled && expandedHeight ? { minHeight: expandedHeight } : undefined;

  return { ref, minHeightStyle };
};

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
  enableParallax,
  overlay = "canvas",
  priority = false,
  loading,
  sizes = "100vw",
}: SectionBackdropProps) {
  const parallaxRef = useParallaxBackground(enableParallax);
  const overlayVisible = revealOverlay ?? reveal;
  const overlayClass = overlay === "none" ? null : overlayClasses[overlay];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div ref={parallaxRef} className="absolute inset-x-0 -top-20 -bottom-20 parallax-image scale-105">
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
      <div
        className={cn(
          "absolute inset-0 bg-(--scrim-strong)",
          reveal ? "opacity-0" : "opacity-100",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0 bg-(--scrim-strong)",
          overlayVisible ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      {overlayClass ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            overlayClass,
            overlayVisible ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

type SectionShellProps = {
  reveal: boolean;
  minHeightClass?: string;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
};

export const SectionShell = forwardRef<HTMLDivElement, SectionShellProps>(
  ({ reveal, minHeightClass, style, className, children }, ref) => (
    <div
      ref={ref}
      style={style}
      className={cn(
        "relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
        reveal
          ? "border-border/70 bg-card/40 shadow-soft backdrop-blur-md sm:bg-card/25 sm:shadow-elevated"
          : "border-transparent bg-transparent shadow-none backdrop-blur-none",
        minHeightClass,
        className,
      )}
    >
      {children}
    </div>
  ),
);

SectionShell.displayName = "SectionShell";

type RevealExpandedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading?: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  collapseLabel?: string;
  children?: ReactNode;
}>;

export function RevealExpandedHeader({
  headingId,
  heading,
  subheading,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
  children,
}: RevealExpandedHeaderProps) {
  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <div className="space-y-3">
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headerThemeReady ? "text-ink" : "text-white"}
          >
            {heading}
          </Heading>
        </div>
        {subheading ? (
          <div className="relative">
            <Text
              size="lg"
              className={cn(
                "type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
            >
              {subheading}
            </Text>
          </div>
        ) : null}
        {children}
      </div>
      {enableTitleReveal ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
          onClick={onCollapse}
        >
          {collapseLabel}
        </button>
      ) : null}
    </div>
  );
}

type RevealCollapsedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading?: string;
  controlsId?: string;
  expanded: boolean;
  onExpand: () => void;
  readMoreLabel?: string;
}>;

export function RevealCollapsedHeader({
  headingId,
  heading,
  subheading,
  controlsId,
  expanded,
  onExpand,
  readMoreLabel = "Read more",
}: RevealCollapsedHeaderProps) {
  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative inline-flex text-white">
        <Heading
          id={headingId}
          level={2}
          size="xl"
          className="type-section-collapsed"
        >
          {heading}
        </Heading>
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer focus-ring"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-controls={controlsId}
          aria-labelledby={headingId}
        >
          <span className="sr-only">Expand {heading}</span>
        </button>
      </div>
      {subheading ? (
        <div className="relative text-white">
          <Text size="lg" className="type-section-subtitle type-section-subtitle-collapsed">
            {subheading}
          </Text>
        </div>
      ) : null}
      <div className="mt-3">
        <Text size="button" className="text-white/80 cursor-pointer focus-ring" asChild>
          <button type="button" onClick={onExpand}>
            {readMoreLabel}
          </button>
        </Text>
      </div>
    </div>
  );
}
