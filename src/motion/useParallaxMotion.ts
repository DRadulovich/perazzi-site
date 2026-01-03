"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { useMotionValue, useMotionValueEvent, useSpring, type MotionValue } from "framer-motion";

type ParallaxOptions = {
  enabled: boolean;
  strength: number;
  targetRef?: RefObject<HTMLElement | null>;
};

const DEFAULT_SPRING = {
  stiffness: 140,
  damping: 26,
  mass: 0.7,
};

const getFallbackRange = (strength: number) => {
  if (typeof window === "undefined") return 0;
  return Math.round(window.innerHeight * strength);
};

export function useParallaxMotion(
  scrollYProgress: MotionValue<number>,
  { enabled, strength, targetRef }: ParallaxOptions,
) {
  const [rangePx, setRangePx] = useState(() => getFallbackRange(strength));
  const rangeMotion = useMotionValue(rangePx);
  const enabledMotion = useMotionValue(enabled ? 1 : 0);

  useEffect(() => {
    enabledMotion.set(enabled ? 1 : 0);
  }, [enabled, enabledMotion]);

  useEffect(() => {
    rangeMotion.set(rangePx);
  }, [rangePx, rangeMotion]);

  useEffect(() => {
    const node = targetRef?.current;
    const updateRange = () => {
      const base = node?.getBoundingClientRect().height ?? getFallbackRange(1);
      setRangePx(Math.round(base * strength));
    };

    updateRange();

    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(updateRange);
    observer.observe(node);
    return () => observer.disconnect();
  }, [strength, targetRef]);

  const rawY = useMotionValue(0);
  const updateRawY = useCallback(() => {
    const progress = scrollYProgress.get();
    const range = rangeMotion.get();
    const isEnabled = enabledMotion.get();
    rawY.set(progress * range * isEnabled);
  }, [enabledMotion, rangeMotion, rawY, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", updateRawY);
  useMotionValueEvent(rangeMotion, "change", updateRawY);
  useMotionValueEvent(enabledMotion, "change", updateRawY);

  useEffect(() => {
    updateRawY();
  }, [updateRawY]);

  return useSpring(rawY, DEFAULT_SPRING);
}
