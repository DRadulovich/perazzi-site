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

const canEnableSmoke = () => {
  const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (reduceMotion?.matches) return false;

  const desktopQuery = globalThis.matchMedia?.("(min-width: 1024px)");
  if (!desktopQuery?.matches) return false;

  const pointerQuery = globalThis.matchMedia?.("(pointer: fine)");
  if (!pointerQuery?.matches) return false;

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

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const container = anchor.closest("section");
    if (container instanceof HTMLElement) {
      setPortalTarget(container);
    }
  }, [anchorRef]);

  return portalTarget;
};

const useSmokeSimulation = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  portalTarget: HTMLElement | null,
) => {
  const pointerRef = useRef<SmokePointer>({ x: 0, y: 0 });
  const dprRef = useRef(1);
  const stopTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !portalTarget) return;
    if (!canEnableSmoke()) return;

    const smoke = createFluidSmoke(canvas, {
      baseColor: [0.15, 0.15, 0.15],
      colorJitter: 0.2,
    });

    const resizeCanvas = () => {
      const rect = portalTarget.getBoundingClientRect();
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      smoke.resize(rect.width, rect.height, dpr);
    };

    resizeCanvas();

    const resizeObserver = observeResize(portalTarget, resizeCanvas);

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
      const scale = dprRef.current;
      const dx = (rawX - pointerRef.current.x) * scale * 4;
      const dy = (rawY - pointerRef.current.y) * scale * 4;

      pointerRef.current.x = rawX;
      pointerRef.current.y = rawY;

      smoke.start();
      smoke.setPointer(rawX * scale, rawY * scale, dx, dy, true);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      clearStopTimer();
      smoke.start();
      const rect = portalTarget.getBoundingClientRect();
      const rawX = event.clientX - rect.left;
      const rawY = event.clientY - rect.top;
      pointerRef.current.x = rawX;
      pointerRef.current.y = rawY;
      smoke.setPointer(rawX * dprRef.current, rawY * dprRef.current, 0, 0, true);
    };

    const handlePointerLeave = () => {
      smoke.setPointer(
        pointerRef.current.x * dprRef.current,
        pointerRef.current.y * dprRef.current,
        0,
        0,
        false,
      );
      clearStopTimer();
      stopTimeoutRef.current = globalThis.setTimeout(() => {
        smoke.stop();
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
      smoke.destroy();
    };
  }, [portalTarget, canvasRef]);
};

export function SectionRevealSmoke({ anchorRef }: SectionRevealSmokeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const portalTarget = usePortalTarget(anchorRef);

  useSmokeSimulation(canvasRef, portalTarget);

  if (!portalTarget) return null;

  return createPortal(
    <div className="section-reveal-smoke" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>,
    portalTarget,
  );
}
