"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { CHAT_TRIGGER_EVENT } from "@/lib/chat-trigger";

const MIN_WIDTH = 360;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 420;
const MOBILE_BREAKPOINT = 768;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<ChatTriggerPayload | null>(null);
  const pathname = usePathname();
  const hideTrigger = pathname?.startsWith("/the-build/why-a-perazzi-has-a-soul");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateMatch = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    updateMatch(query);
    const listener = (event: MediaQueryListEvent) => updateMatch(event);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isMobile) {
      root.style.setProperty("--chat-rail-width", "0px");
      return;
    }
    const widthValue = isOpen ? `${panelWidth}px` : "0px";
    root.style.setProperty("--chat-rail-width", widthValue);
  }, [isOpen, panelWidth, isMobile]);

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--chat-rail-width");
    },
    [],
  );

  useEffect(() => {
    if (!isResizing) return;

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
  }, [isResizing]);

  const bodyLocked = isMobile && isOpen;
  useEffect(() => {
    if (!bodyLocked || typeof document === "undefined") return;
    const scrollY = window.scrollY;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyWidth = document.body.style.width;
    const originalBodyTop = document.body.style.top;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.body.style.top = originalBodyTop;
      window.scrollTo(0, scrollY);
    };
  }, [bodyLocked]);

  useEffect(() => {
    if (!isMobile || !isOpen || typeof window === "undefined") return;
    const updateViewportVars = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      document.documentElement.style.setProperty("--chat-sheet-height", `${height}px`);
      document.documentElement.style.setProperty("--chat-sheet-offset", `${offset}px`);
    };
    updateViewportVars();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updateViewportVars);
    viewport?.addEventListener("scroll", updateViewportVars);
    window.addEventListener("resize", updateViewportVars);
    return () => {
      viewport?.removeEventListener("resize", updateViewportVars);
      viewport?.removeEventListener("scroll", updateViewportVars);
      window.removeEventListener("resize", updateViewportVars);
      document.documentElement.style.removeProperty("--chat-sheet-height");
      document.documentElement.style.removeProperty("--chat-sheet-offset");
    };
  }, [isMobile, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ChatTriggerPayload>).detail ?? {};
      setPendingPrompt(detail);
      setIsOpen(true);
    };
    window.addEventListener(CHAT_TRIGGER_EVENT, handler as EventListener);
    return () => window.removeEventListener(CHAT_TRIGGER_EVENT, handler as EventListener);
  }, []);

  const consumePrompt = () => setPendingPrompt(null);

  return (
    <>
      {isMobile ? (
        <>
          {!isOpen && (
            <button
              type="button"
              aria-label="Open Perazzi Concierge"
              onClick={() => setIsOpen(true)}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm sm:text-base font-semibold text-card shadow-elevated transition hover:bg-brand-hover focus-ring"
            >
              Perazzi Guide
            </button>
          )}
          {isOpen && (
            <div
              className="fixed inset-0 z-50 bg-card text-ink overscroll-none"
              style={{
                height: "var(--chat-sheet-height, 100vh)",
                top: "var(--chat-sheet-offset, 0px)",
              }}
            >
              <ChatPanel
                open
                onClose={handleClose}
                variant="sheet"
                pendingPrompt={pendingPrompt}
                onPromptConsumed={consumePrompt}
                className="rounded-none shadow-none h-full"
              />
            </div>
          )}
        </>
      ) : (
        <>
          {isOpen && (
            <aside
              className="fixed right-0 top-0 z-40 flex h-full flex-col bg-transparent"
              style={{ width: panelWidth }}
            >
              <div
                className="absolute left-0 top-0 z-50 h-full w-2 cursor-col-resize border-l border-transparent transition hover:border-l-subtle"
                onMouseDown={() => setIsResizing(true)}
                role="separator"
                aria-orientation="vertical"
                aria-hidden="true"
              />
              <ChatPanel
                open
                onClose={handleClose}
                variant="rail"
                pendingPrompt={pendingPrompt}
                onPromptConsumed={consumePrompt}
              />
            </aside>
          )}
          {!isOpen && !hideTrigger && (
            <button
              type="button"
              aria-label="Open Perazzi Concierge"
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 z-30 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm sm:text-base font-semibold text-card shadow-elevated transition hover:bg-brand-hover focus-ring"
            >
              Open Perazzi Guide
            </button>
          )}
        </>
      )}
    </>
  );
}
