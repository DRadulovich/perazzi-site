import { useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useParallaxBackground = (enabled: boolean) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!enabled) {
      return;
    }

    const updateTarget = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = globalThis.innerHeight || 1;
      const offset =
        (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const clamped = clamp(offset, -1, 1);
      const eased = Math.sign(clamped) * Math.sin(Math.abs(clamped) * Math.PI / 2);
      targetRef.current = Math.round(eased * -72);
    };

    const animate = () => {
      frameRef.current = 0;
      const current = currentRef.current;
      const target = targetRef.current;
      const next = current + (target - current) * 0.12;
      currentRef.current = next;
      node.style.setProperty("--parallax-y", `${Math.round(next)}px`);
      if (Math.abs(target - next) > 0.5) {
        frameRef.current = globalThis.requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      updateTarget();
      if (!frameRef.current) {
        frameRef.current = globalThis.requestAnimationFrame(animate);
      }
    };

    onScroll();
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onScroll);

    return () => {
      globalThis.removeEventListener("scroll", onScroll);
      globalThis.removeEventListener("resize", onScroll);
      if (frameRef.current) {
        globalThis.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [enabled]);

  return ref;
};
