"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
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
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const pathname = usePathname();
  const hideTrigger = pathname.startsWith("/the-build/why-a-perazzi-has-a-soul");

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") return;
    const query = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateMatch = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    updateMatch(query);
    const listener = (event: MediaQueryListEvent) => { updateMatch(event); };
    query.addEventListener("change", listener);
    return () => { query.removeEventListener("change", listener); };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const updateHeroVisibility = (visible: boolean) => {
      setIsHeroVisible(visible);
    };
    const heroHeading = document.getElementById("home-hero-heading");
    if (!heroHeading || typeof IntersectionObserver === "undefined") {
      updateHeroVisibility(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        updateHeroVisibility(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(heroHeading);
    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isMobile) {
      root.style.setProperty("--chat-rail-width", "0px");
      root.style.setProperty("--chat-panel-width", "0px");
      return;
    }
    const widthValue = isOpen ? `${panelWidth}px` : "0px";
    root.style.setProperty("--chat-rail-width", widthValue);
    root.style.setProperty("--chat-panel-width", widthValue);
  }, [isOpen, panelWidth, isMobile]);

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--chat-rail-width");
      document.documentElement.style.removeProperty("--chat-panel-width");
    },
    [],
  );

  useEffect(() => {
    if (!isResizing) return;
    if (!("innerWidth" in globalThis)) return;

    const handleMouseMove = (event: MouseEvent) => {
      const calculated = globalThis.innerWidth - event.clientX;
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, calculated));
      setPanelWidth(clamped);
    };

    const stopResizing = () => { setIsResizing(false); };

    globalThis.addEventListener("mousemove", handleMouseMove);
    globalThis.addEventListener("mouseup", stopResizing);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
      globalThis.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  const bodyLocked = isMobile && isOpen;
  useEffect(() => {
    if (!bodyLocked || !("document" in globalThis)) return;
    if (!("scrollY" in globalThis) || typeof globalThis.scrollTo !== "function") return;

    const scrollY = globalThis.scrollY;
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
      globalThis.scrollTo(0, scrollY);
    };
  }, [bodyLocked]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;
    if (!("visualViewport" in globalThis)) return;

    const updateViewportVars = () => {
      const viewport = globalThis.visualViewport;
      const height = viewport?.height ?? globalThis.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      document.documentElement.style.setProperty("--chat-sheet-height", `${height}px`);
      document.documentElement.style.setProperty("--chat-sheet-offset", `${offset}px`);
    };

    updateViewportVars();
    const viewport = globalThis.visualViewport;
    viewport?.addEventListener("resize", updateViewportVars);
    viewport?.addEventListener("scroll", updateViewportVars);
    globalThis.addEventListener("resize", updateViewportVars);

    return () => {
      viewport?.removeEventListener("resize", updateViewportVars);
      viewport?.removeEventListener("scroll", updateViewportVars);
      globalThis.removeEventListener("resize", updateViewportVars);
      document.documentElement.style.removeProperty("--chat-sheet-height");
      document.documentElement.style.removeProperty("--chat-sheet-offset");
    };
  }, [isMobile, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (typeof globalThis.addEventListener !== "function") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ChatTriggerPayload>).detail ?? {};
      setPendingPrompt(detail);
      setIsOpen(true);
    };

    globalThis.addEventListener(CHAT_TRIGGER_EVENT, handler as EventListener);
    return () => { globalThis.removeEventListener(CHAT_TRIGGER_EVENT, handler as EventListener); };
  }, []);

  const consumePrompt = () => { setPendingPrompt(null); };

  return (
    <>
      {isMobile ? (
        <>
      {!isOpen && !hideTrigger && !isHeroVisible && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            aria-label="Open Perazzi Concierge"
            onClick={() => { setIsOpen(true); }}
            className="chat-widget-trigger focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-perazzi-red shadow-elevated ring-1 ring-black/10 hover:bg-perazzi-red/90 active:bg-perazzi-red/95"
          >
            <Image
              src="/images/pgpt-widget-icon.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="h-9 w-9"
            />
          </button>
            </div>
          )}
          <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
              <Dialog.Content className="fixed inset-x-0 z-60 overscroll-none outline-none data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2 data-[state=open]:opacity-100 data-[state=open]:translate-y-0 transition duration-200 chat-sheet">
                <div className="absolute inset-0 p-3 sm:p-4">
                  <ChatPanel
                    open
                    onClose={handleClose}
                    variant="sheet"
                    pendingPrompt={pendingPrompt}
                    onPromptConsumed={consumePrompt}
                    className="h-full w-full"
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      ) : (
        <>
          {isOpen && (
            <aside
              className="fixed right-0 top-0 z-50 flex h-full flex-col bg-transparent chat-panel-width"
            >
              <div
                className="absolute left-0 top-0 z-50 h-full w-2 cursor-col-resize border-l border-transparent transition hover:border-l-subtle"
                onMouseDown={() => { setIsResizing(true); }}
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
          {!isOpen && !hideTrigger && !isHeroVisible && (
            <div className="fixed bottom-6 right-6 z-30">
              <button
                type="button"
                aria-label="Open Perazzi Concierge"
                onClick={() => setIsOpen(true)}
                className="chat-widget-trigger focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-perazzi-red shadow-elevated ring-1 ring-black/10 hover:bg-perazzi-red/90 active:bg-perazzi-red/95"
              >
                <Image
                  src="/images/pgpt-widget-icon.png"
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                  className="h-9 w-9"
                />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
