"use client";

import { useEffect } from "react";

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (typeof document === "undefined" || typeof globalThis.window === "undefined") return;

    const scrollY = globalThis.window.scrollY;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const originalHtmlOverflow = htmlStyle.overflow;
    const originalBodyOverflow = bodyStyle.overflow;
    const originalBodyPosition = bodyStyle.position;
    const originalBodyWidth = bodyStyle.width;
    const originalBodyTop = bodyStyle.top;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.width = "100%";
    bodyStyle.top = `-${scrollY}px`;

    return () => {
      htmlStyle.overflow = originalHtmlOverflow;
      bodyStyle.overflow = originalBodyOverflow;
      bodyStyle.position = originalBodyPosition;
      bodyStyle.width = originalBodyWidth;
      bodyStyle.top = originalBodyTop;
      if (typeof globalThis.window.scrollTo === "function") {
        globalThis.window.scrollTo(0, scrollY);
      }
    };
  }, [locked]);
}
