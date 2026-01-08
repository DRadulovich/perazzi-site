import { useCallback, useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useParallaxBackground = (enabled: boolean) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const frameRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef(false);

  const updateTarget = useCallback(() => {
    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const viewportHeight = globalThis.innerHeight || 1;
    const offset =
      (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
    const clamped = clamp(offset, -1, 1);
    const eased = Math.sign(clamped) * Math.sin(Math.abs(clamped) * Math.PI / 2);
    targetRef.current = Math.round(eased * -72);
  }, []);

  const animate = useCallback(function animateLoop() {
    frameRef.current = 0;
    const current = currentRef.current;
    const target = targetRef.current;
    const next = current + (target - current) * 0.12;
    currentRef.current = next;
    const node = ref.current;
    if (node) {
      node.style.setProperty("--parallax-y", `${Math.round(next)}px`);
    }

    if (isActiveRef.current && Math.abs(target - next) > 0.5) {
      frameRef.current = globalThis.requestAnimationFrame(animateLoop);
    }
  }, []);

  useEffect(() => {
    const node = ref.current;

    const stop = () => {
      if (!isActiveRef.current) return;
      isActiveRef.current = false;
      const handler = scrollHandlerRef.current;
      if (handler) {
        globalThis.removeEventListener("scroll", handler);
        globalThis.removeEventListener("resize", handler);
      }
      if (frameRef.current) {
        globalThis.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      scrollHandlerRef.current = null;
    };

    if (!node || !enabled) {
      stop();
      observerRef.current?.disconnect();
      observerRef.current = null;
      return () => stop();
    }

    const onScroll = () => {
      updateTarget();
      if (!frameRef.current) {
        frameRef.current = globalThis.requestAnimationFrame(animate);
      }
    };

    scrollHandlerRef.current = onScroll;

    const start = () => {
      if (isActiveRef.current) return;
      isActiveRef.current = true;
      updateTarget();
      onScroll();
      globalThis.addEventListener("scroll", onScroll, { passive: true });
      globalThis.addEventListener("resize", onScroll);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        }
      },
      { rootMargin: "120% 0px 120% 0px" },
    );

    observer.observe(node);
    observerRef.current = observer;

    return () => {
      stop();
      observer.disconnect();
      observerRef.current = null;
    };
  }, [enabled, animate, updateTarget]);

  return ref;
};
