"use client";

import { useEffect, useRef } from "react";

import type { DisciplineCard } from "./DisciplineRailData";

type UseDisciplineImagePreloadOptions = {
  disciplines: readonly DisciplineCard[];
  isHydrated: boolean;
};

export function useDisciplineImagePreload({
  disciplines,
  isHydrated,
}: UseDisciplineImagePreloadOptions) {
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isHydrated || globalThis.Image === undefined) return;
    const urls = new Set<string>();
    disciplines.forEach((discipline) => {
      if (discipline.hero?.url) urls.add(discipline.hero.url);
      discipline.popularModels?.forEach((model) => {
        if (model.hero?.url) urls.add(model.hero.url);
      });
    });
    urls.forEach((url) => {
      if (preloadedImagesRef.current.has(url)) return;
      const image = new globalThis.Image();
      image.decoding = "async";
      image.src = url;
      preloadedImagesRef.current.add(url);
    });
  }, [disciplines, isHydrated]);
}
