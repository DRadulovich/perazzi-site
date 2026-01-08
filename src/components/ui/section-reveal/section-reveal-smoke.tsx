"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createFluidSmoke } from "@/lib/fluid-smoke";

type SectionRevealSmokeProps = Readonly<{
  anchorRef: RefObject<HTMLButtonElement | null>;
}>;

type SmokePointer = { x: number; y: number };

const MIN_MOVE_THRESHOLD = 2;

const canEnableSmoke = () => {
  const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduceMotion?.matches) return false;

  const desktopQuery = globalThis.matchMedia?.("(min-width: 1024px)");
  if (!desktopQuery?.matches) return false;

  const pointerQuery = globalThis.matchMedia?.("(pointer: fine)");
  if (!pointerQuery?.matches) return false;

  const connection = (globalThis.navigator as Navigator & {
    connection?: { saveData?: boolean };
  })?.connection;
  if (connection?.saveData) return false;

  return true;
};

const observeResize = (target: HTMLElement, onResize: () => void) => {
  if (typeof ResizeObserver === "undefined") return null;
  const observer = new ResizeObserver(onResize);
  observer.observe(target);
  return observer;
};

const usePortalTarget = (anchorRef: RefObject<HTMLButtonElement | null>) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const section = anchor.closest("section");
    if (section instanceof HTMLElement) {
      setPortalTarget(section);
    }
  }, [anchorRef]);

  useEffect(() => {
    if (!portalTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setIsVisible(visible);
      },
      { rootMargin: "120% 0px 120% 0px" },
    );

    observer.observe(portalTarget);
    return () => {
      observer.disconnect();
      setIsVisible(false);
    };
  }, [portalTarget]);

  return { portalTarget, isVisible };
};

const useSmokeSimulation = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  portalTarget: HTMLElement | null,
  enabled: boolean,
) => {
  const pointerRef = useRef<SmokePointer>({ x: 0, y: 0 });
  const dprRef = useRef(1);
  const stopTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const smokeRef = useRef<ReturnType<typeof createFluidSmoke> | null>(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !portalTarget || !enabled) return;

    const resizeCanvas = (smoke: ReturnType<typeof createFluidSmoke>) => {
      const rect = portalTarget.getBoundingClientRect();
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      smoke.resize(rect.width, rect.height, dpr);
    };

    const ensureSmoke = () => {
      if (smokeRef.current) return smokeRef.current;
      const smoke = createFluidSmoke(canvas, {
        baseColor: [0.15, 0.15, 0.15],
        colorJitter: 0.2,
      });
      smokeRef.current = smoke;
      resizeCanvas(smoke);
      return smoke;
    };

    const resizeObserver = observeResize(portalTarget, () => {
      const smoke = smokeRef.current;
      if (smoke) {
        resizeCanvas(smoke);
      }
    });

    const clearStopTimer = () => {
      if (stopTimeoutRef.current !== null) {
        globalThis.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = portalTarget.getBoundingClientRect();
      const rawX = event.clientX - rect.left;
      const rawY = event.clientY - rect.top;
      const dx = rawX - pointerRef.current.x;
      const dy = rawY - pointerRef.current.y;
      const scale = dprRef.current;
      const delta = Math.hypot(dx, dy);

      pointerRef.current.x = rawX;
      pointerRef.current.y = rawY;

      if (!hasMovedRef.current && delta < MIN_MOVE_THRESHOLD) return;
      hasMovedRef.current = true;

      const smoke = ensureSmoke();
      smoke.start();
      smoke.setPointer(rawX * scale, rawY * scale, dx * scale * 4, dy * scale * 4, true);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      clearStopTimer();
      const rect = portalTarget.getBoundingClientRect();
      const rawX = event.clientX - rect.left;
      const rawY = event.clientY - rect.top;
      pointerRef.current.x = rawX;
      pointerRef.current.y = rawY;
      hasMovedRef.current = false;
      const smoke = ensureSmoke();
      smoke.setPointer(rawX * dprRef.current, rawY * dprRef.current, 0, 0, true);
    };

    const handlePointerLeave = () => {
      const smoke = smokeRef.current;
      smoke?.setPointer(
        pointerRef.current.x * dprRef.current,
        pointerRef.current.y * dprRef.current,
        0,
        0,
        false,
      );
      clearStopTimer();
      hasMovedRef.current = false;
      stopTimeoutRef.current = globalThis.setTimeout(() => {
        smoke?.stop();
      }, 5000);
    };

    portalTarget.addEventListener("pointerenter", handlePointerEnter);
    portalTarget.addEventListener("pointermove", handlePointerMove);
    portalTarget.addEventListener("pointerleave", handlePointerLeave);
    portalTarget.addEventListener("pointercancel", handlePointerLeave);

    return () => {
      portalTarget.removeEventListener("pointerenter", handlePointerEnter);
      portalTarget.removeEventListener("pointermove", handlePointerMove);
      portalTarget.removeEventListener("pointerleave", handlePointerLeave);
      portalTarget.removeEventListener("pointercancel", handlePointerLeave);
      resizeObserver?.disconnect();
      clearStopTimer();
      smokeRef.current?.destroy();
      smokeRef.current = null;
    };
  }, [portalTarget, canvasRef, enabled]);
};

export function SectionRevealSmoke({ anchorRef }: SectionRevealSmokeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { portalTarget, isVisible } = usePortalTarget(anchorRef);
  const shouldRender = Boolean(portalTarget && isVisible && canEnableSmoke());

  useSmokeSimulation(canvasRef, portalTarget, shouldRender);

  if (!portalTarget || !shouldRender) return null;

  return createPortal(
    <div className="section-reveal-smoke" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>,
    portalTarget,
  );
}
