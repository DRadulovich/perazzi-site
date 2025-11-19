"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";

const MIN_WIDTH = 360;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 420;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const widthValue = isOpen && !isFullscreen ? `${panelWidth}px` : "0px";
    root.style.setProperty("--chat-rail-width", widthValue);
  }, [isOpen, isFullscreen, panelWidth]);

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--chat-rail-width");
    },
    [],
  );

  useEffect(() => {
    if (!isResizing || isFullscreen) return;

    const handleMouseMove = (event: MouseEvent) => {
      const calculated = window.innerWidth - event.clientX;
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, calculated));
      setPanelWidth(clamped);
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, isFullscreen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const headerActions = useMemo(
    () => (
      <>
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="rounded-full border border-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
        >
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
        {!isFullscreen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
          >
            Hide
          </button>
        )}
      </>
    ),
    [isFullscreen],
  );

  const handleClose = () => {
    setIsFullscreen(false);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <aside
          className={`fixed right-0 top-0 z-40 flex h-full flex-col bg-transparent ${isFullscreen ? "left-0 w-full" : ""}`}
          style={!isFullscreen ? { width: panelWidth } : undefined}
        >
          {!isFullscreen && (
            <div
              className="absolute left-0 top-0 z-50 h-full w-2 cursor-col-resize border-l border-transparent transition hover:border-l-subtle"
              onMouseDown={() => setIsResizing(true)}
              role="separator"
              aria-orientation="vertical"
              aria-hidden="true"
            />
          )}
          <ChatPanel open onClose={handleClose} headerActions={headerActions} />
        </aside>
      )}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-30 rounded-full bg-brand px-6 py-3 text-card shadow-elevated transition hover:bg-brand-hover focus:outline-none focus-visible:ring"
        >
          Open Perazzi Concierge
        </button>
      )}
    </>
  );
}
