import { useEffect, useState, type RefObject } from "react";

type HeightLockOptions = {
  enabled: boolean;
  duration?: number;
};

export function useHeightLock(
  targetRef: RefObject<HTMLElement | null>,
  { enabled, duration = 0.8 }: HeightLockOptions,
) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = targetRef.current;
    if (!node) return;

    let frame = 0;
    let observer: ResizeObserver | null = null;
    let timeoutId: number | null = null;

    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!node) return;
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        setHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(updateHeight);
      observer.observe(node);
      timeoutId = window.setTimeout(() => {
        observer?.disconnect();
        observer = null;
      }, Math.max(0, duration) * 1000 + 150);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      observer?.disconnect();
    };
  }, [enabled, duration, targetRef]);

  return height;
}
