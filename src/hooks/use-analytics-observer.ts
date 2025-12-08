"use client";

import { useEffect, useRef } from "react";
import { logAnalytics } from "@/lib/analytics";

const defaultObserverOptions: IntersectionObserverInit = { threshold: 0.5 };

export function useAnalyticsObserver<T extends HTMLElement = HTMLElement>(
  analyticsId: string,
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null);
  const observerOptions = options ?? defaultObserverOptions;

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
          logAnalytics(analyticsId);
          observer.disconnect();
        }
      });
    }, observerOptions);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [analyticsId, observerOptions]);

  return ref;
}
