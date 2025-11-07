"use client";

import { useEffect, useRef } from "react";

export function useAnalyticsObserver(
  analyticsId: string,
  options: IntersectionObserverInit = { threshold: 0.5 },
) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    let hasLogged = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!hasLogged && entry.isIntersecting) {
          hasLogged = true;
          console.log(`[analytics] ${analyticsId}`);
          observer.disconnect();
        }
      });
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [analyticsId, options]);

  return ref;
}
