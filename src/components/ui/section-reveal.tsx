"use client";

import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  enableObserver: boolean;
  deps?: readonly unknown[];
  revealDelayMs?: number;
};

export const useRevealHeight = ({
  enableObserver,
  deps = [],
  revealDelayMs = 900,
}: RevealHeightOptions) => {
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [premeasureHeight, setPremeasureHeight] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const pendingExpandRef = useRef<(() => void) | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const getFrameOffset = useCallback(() => {
    const frame = ref.current;
    if (!frame || typeof globalThis.getComputedStyle !== "function") return 0;
    const style = globalThis.getComputedStyle(frame);
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    return paddingTop + paddingBottom + borderTop + borderBottom;
  }, []);

  const measureHeight = useCallback((node: HTMLElement, includeFrameOffset: boolean) => {
    const baseHeight = node.getBoundingClientRect().height;
    const offset = includeFrameOffset ? getFrameOffset() : 0;
    return Math.ceil(baseHeight + offset);
  }, [getFrameOffset]);

  useEffect(() => {
    if (!enableObserver) return;
    const node = contentRef.current ?? ref.current;
    if (!node) return;
    const includeFrameOffset = node === contentRef.current;

    const updateHeight = () => {
      const nextHeight = measureHeight(node, includeFrameOffset);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableObserver, deps, measureHeight]);

  useLayoutEffect(() => {
    if (!isPreparing) return;
    const node = measureRef.current ?? contentRef.current ?? ref.current;
    if (!node) return;
    const includeFrameOffset = node === contentRef.current;

    const nextHeight = measureHeight(node, includeFrameOffset);
    setPremeasureHeight(nextHeight);

    const pendingExpand = pendingExpandRef.current;
    if (!pendingExpand) {
      setIsPreparing(false);
      return;
    }

    pendingExpandRef.current = null;
    globalThis.requestAnimationFrame(() => {
      revealTimeoutRef.current = globalThis.setTimeout(() => {
        pendingExpand();
        setIsPreparing(false);
        revealTimeoutRef.current = null;
      }, revealDelayMs);
    });
  }, [isPreparing, revealDelayMs, measureHeight]);

  const resolvedHeight =
    enableObserver && expandedHeight !== null ? expandedHeight : premeasureHeight;

  const minHeightStyle: CSSProperties | undefined =
    resolvedHeight === null ? undefined : { minHeight: resolvedHeight };

  const beginExpand = (onExpand: () => void) => {
    pendingExpandRef.current = onExpand;
    setIsPreparing(true);
  };

  const clearPremeasure = () => {
    setPremeasureHeight(null);
    pendingExpandRef.current = null;
    if (revealTimeoutRef.current !== null) {
      globalThis.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  };

  return {
    ref,
    contentRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  };
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
        "section-reveal-shell relative flex flex-col space-y-6 rounded-2xl border p-4 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10",
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

type RevealAnimatedBodyProps = Readonly<{
  children: ReactNode;
  sequence?: boolean;
  delayMs?: number;
  staggerMs?: number;
  durationMs?: number;
  easing?: string;
  className?: string;
}>;

export function RevealAnimatedBody({
  children,
  sequence = false,
  delayMs = 0,
  staggerMs = 90,
  durationMs = 520,
  easing = "cubic-bezier(0.16, 1, 0.3, 1)",
  className,
}: RevealAnimatedBodyProps) {
  const style = sequence
    ? ({
        "--reveal-delay": `${delayMs}ms`,
        "--reveal-stagger": `${staggerMs}ms`,
        "--reveal-duration": `${durationMs}ms`,
        "--reveal-ease": easing,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={cn("section-reveal-body", className)}
      data-reveal-sequence={sequence ? "true" : undefined}
      style={style}
    >
      {children}
    </div>
  );
}

type RevealItemProps = Readonly<{
  children: ReactNode;
  index?: number;
  className?: string;
  style?: CSSProperties;
  asChild?: boolean;
}>;

export function RevealItem({
  children,
  index,
  className,
  style = {},
  asChild = false,
}: RevealItemProps) {
  const Comp = asChild ? Slot : "div";
  const resolvedStyle = { ...style } as CSSProperties;

  if (typeof index === "number") {
    (resolvedStyle as Record<string, string | number>)["--reveal-index"] = index;
  }

  return (
    <Comp data-reveal-item className={className} style={resolvedStyle}>
      {children}
    </Comp>
  );
}

type RevealGroupProps = Readonly<{
  children: ReactNode;
  delayMs?: number;
  staggerMs?: number;
  durationMs?: number;
  easing?: string;
  className?: string;
  style?: CSSProperties;
  asChild?: boolean;
}>;

export function RevealGroup({
  children,
  delayMs,
  staggerMs,
  durationMs,
  easing,
  className,
  style = {},
  asChild = false,
}: RevealGroupProps) {
  const Comp = asChild ? Slot : "div";
  const resolvedStyle = { ...style } as CSSProperties;

  if (typeof delayMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-delay"] = `${delayMs}ms`;
  }

  if (typeof staggerMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-stagger"] = `${staggerMs}ms`;
  }

  if (typeof durationMs === "number") {
    (resolvedStyle as Record<string, string>)["--reveal-duration"] = `${durationMs}ms`;
  }

  if (typeof easing === "string" && easing.length > 0) {
    (resolvedStyle as Record<string, string>)["--reveal-ease"] = easing;
  }

  return (
    <Comp data-reveal-group className={className} style={resolvedStyle}>
      {children}
    </Comp>
  );
}

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
  readMoreLabel = "Click to Expand",
}: RevealCollapsedHeaderProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const section = buttonRef.current?.closest("section");
    if (section) {
      delete section.dataset.revealExpanding;
    }
  }, []);

  useEffect(() => {
    const section = buttonRef.current?.closest("section");
    if (!section || section.dataset.revealInvite === "true") return;

    const triggerInvite = () => {
      section.dataset.revealInvite = "true";
    };

    if (typeof IntersectionObserver === "undefined") {
      triggerInvite();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          triggerInvite();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  const activateTease = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    const section = event.currentTarget.closest("section");
    if (!section) return;

    section.dataset.teaseActive = "true";
    if (section.dataset.teaseBound === "true") return;

    const clearTease = (leaveEvent?: Event) => {
      if (leaveEvent?.type === "focusout") {
        const nextTarget = (leaveEvent as FocusEvent).relatedTarget;
        if (nextTarget && section.contains(nextTarget as Node)) return;
      }
      delete section.dataset.teaseActive;
    };

    section.addEventListener("mouseleave", clearTease);
    section.addEventListener("focusout", clearTease);
    section.dataset.teaseBound = "true";
  };

  const handleExpand = (event: React.MouseEvent<HTMLButtonElement>) => {
    const section = event.currentTarget.closest("section");
    if (section) {
      delete section.dataset.teaseActive;
      section.dataset.revealExpanding = "true";
    }
    onExpand();
  };

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <button
        type="button"
        className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-4 py-3 text-center transition-transform duration-300 focus-ring"
        onClick={handleExpand}
        onPointerEnter={activateTease}
        onFocus={activateTease}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-labelledby={headingId}
        data-tease-trigger
        data-reveal-collapsed
        ref={buttonRef}
      >
        <div className="relative inline-flex text-white">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className="type-section-collapsed section-reveal-collapsed-text"
          >
            {heading}
          </Heading>
        </div>
        {subheading ? (
          <div className="relative text-white">
            <Text
              size="lg"
              className="type-section-subtitle type-section-subtitle-collapsed section-reveal-collapsed-text"
            >
              {subheading}
            </Text>
          </div>
        ) : null}
        <div className="mt-3">
          <Text
            asChild
            size="button"
            className="section-reveal-collapsed-text section-reveal-cta relative isolate inline-flex items-center justify-center overflow-hidden rounded-sm border border-white/40 bg-white/10 px-4 py-2 text-white/90 shadow-soft backdrop-blur-sm transition-colors duration-200 group-hover:border-white/60 group-hover:bg-white/15 group-hover:text-white group-focus-visible:border-white/60 group-focus-visible:bg-white/15 group-focus-visible:text-white"
          >
            <span>
              <span className="section-reveal-cta-label">{readMoreLabel}</span>
              <span
                className="section-reveal-cta-glint glint-sweep pointer-events-none absolute inset-0"
                aria-hidden="true"
              />
            </span>
          </Text>
        </div>
        <span className="sr-only">Expand {heading}</span>
      </button>
    </div>
  );
}
