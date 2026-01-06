"use client";

import * as React from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    const windowRef = globalThis.window as Window | undefined;
    const matchMedia = windowRef?.matchMedia;
    if (matchMedia === undefined) return;

    const media = matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      setPrefersReduced(media.matches);
    };

    handleChange();
    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReduced;
}
