"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type RevealHeightOptions = {
  enableObserver: boolean;
  deps?: readonly unknown[];
  revealDelayMs?: number;
};

type RevealHeightRefs = {
  frameRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  measureRef: RefObject<HTMLDivElement | null>;
};

const getFrameOffset = (frame: HTMLElement | null) => {
  if (!frame || typeof globalThis.getComputedStyle !== "function") return 0;
  const style = globalThis.getComputedStyle(frame);
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
  const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
  return paddingTop + paddingBottom + borderTop + borderBottom;
};

const measureNodeHeight = (
  node: HTMLElement,
  includeFrameOffset: boolean,
  frame: HTMLElement | null,
) => {
  const baseHeight = node.getBoundingClientRect().height;
  const offset = includeFrameOffset ? getFrameOffset(frame) : 0;
  return Math.ceil(baseHeight + offset);
};

const useExpandedHeight = (
  { frameRef, contentRef }: RevealHeightRefs,
  enableObserver: boolean,
  deps: readonly unknown[],
) => {
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enableObserver) return;
    const node = contentRef.current ?? frameRef.current;
    if (!node) return;
    const includeFrameOffset = node === contentRef.current;

    const updateHeight = () => {
      const nextHeight = measureNodeHeight(node, includeFrameOffset, frameRef.current);
      setExpandedHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enableObserver, deps, frameRef, contentRef]);

  return expandedHeight;
};

type PremeasureState = {
  premeasureHeight: number | null;
  isPreparing: boolean;
  beginExpand: (onExpand: () => void) => void;
  clearPremeasure: () => void;
};

const usePremeasureHeight = (
  { frameRef, contentRef, measureRef }: RevealHeightRefs,
  revealDelayMs: number,
): PremeasureState => {
  const [premeasureHeight, setPremeasureHeight] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const pendingExpandRef = useRef<(() => void) | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!isPreparing) return;
    const node = measureRef.current ?? contentRef.current ?? frameRef.current;
    if (!node) return;
    const includeFrameOffset = node === contentRef.current;

    const nextHeight = measureNodeHeight(node, includeFrameOffset, frameRef.current);
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
  }, [isPreparing, revealDelayMs, frameRef, contentRef, measureRef]);

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
    premeasureHeight,
    isPreparing,
    beginExpand,
    clearPremeasure,
  };
};

export const useRevealHeight = ({
  enableObserver,
  deps = [],
  revealDelayMs = 1200,
}: RevealHeightOptions) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const expandedHeight = useExpandedHeight(
    { frameRef, contentRef, measureRef },
    enableObserver,
    deps,
  );
  const { premeasureHeight, isPreparing, beginExpand, clearPremeasure } = usePremeasureHeight(
    { frameRef, contentRef, measureRef },
    revealDelayMs,
  );

  const resolvedHeight =
    enableObserver && expandedHeight !== null ? expandedHeight : premeasureHeight;

  const minHeightStyle: CSSProperties | undefined =
    resolvedHeight === null ? undefined : { minHeight: resolvedHeight };

  return {
    ref: frameRef,
    contentRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  };
};
