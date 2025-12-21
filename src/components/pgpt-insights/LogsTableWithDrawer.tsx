"use client";

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import type { RefObject } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { getTextStorageBadges } from "../../lib/pgpt-insights/logTextStatus";
import type { PerazziLogPreviewRow, PgptLogDetailResponse } from "../../lib/pgpt-insights/types";

import { CopyButton } from "./CopyButton";
import { formatTimestampShort } from "./format";
import { cn, getWindowOrNull } from "./LogsTableWithDrawer.helpers";
import { QATab } from "./LogsTableWithDrawer.qa";
import { DrawerSkeleton, LogsTable, PromptTab, ResponseTab, RetrievalTab, SummaryTab } from "./LogsTableWithDrawer.parts";

type TabKey = "summary" | "prompt" | "response" | "retrieval" | "qa";

type RefLike<T> = { current: T };

type UseLogDetailArgs = Readonly<{
  open: boolean;
  selectedId: string | null;
  cacheRef: RefLike<Map<string, PgptLogDetailResponse>>;
}>;

function useLogDetail({ open, selectedId, cacheRef }: UseLogDetailArgs) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PgptLogDetailResponse | null>(null);

  useEffect(() => {
    if (!open || !selectedId) return;

    const cached = cacheRef.current.get(selectedId);
    if (cached) {
      setDetail(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);
    setDetail(null);

    fetch(`/api/admin/pgpt-insights/log/${encodeURIComponent(selectedId)}`, { method: "GET", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load interaction (${res.status})`);
        return (await res.json()) as PgptLogDetailResponse;
      })
      .then((data) => {
        if (cancelled) return;
        cacheRef.current.set(selectedId, data);
        setDetail(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load interaction";
        setError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheRef, open, selectedId]);

  return { detail, loading, error };
}

function useQaReturnTo(open: boolean) {
  return useMemo(() => {
    if (!open) return "";
    const win = getWindowOrNull();
    if (!win) return "";
    try {
      const base = win.location.href.split("#")[0];
      return `${base}#logs`;
    } catch {
      return "";
    }
  }, [open]);
}

function useInteractionSummary(detail: PgptLogDetailResponse | null, selectedPreview: PerazziLogPreviewRow | null) {
  return useMemo(() => {
    if (detail?.log) {
      return `${formatTimestampShort(detail.log.created_at)} · ${detail.log.env} · ${detail.log.endpoint}`;
    }
    if (selectedPreview) {
      return `${formatTimestampShort(selectedPreview.created_at)} · ${selectedPreview.env} · ${selectedPreview.endpoint}`;
    }
    return "";
  }, [detail, selectedPreview]);
}

function useDetailTextStatus(detail: PgptLogDetailResponse | null, fallbackMetadata: unknown) {
  return useMemo(() => {
    if (!detail?.log) return null;
    return getTextStorageBadges({
      promptText: detail.log.prompt,
      responseText: detail.log.response,
      metadata: detail.log.metadata ?? fallbackMetadata,
      logTextMode: detail.log.log_text_mode,
      logTextMaxChars: detail.log.log_text_max_chars,
      promptTextOmitted: detail.log.prompt_text_omitted,
      responseTextOmitted: detail.log.response_text_omitted,
      promptTextTruncated: detail.log.prompt_text_truncated,
      responseTextTruncated: detail.log.response_text_truncated,
    });
  }, [detail, fallbackMetadata]);
}

const TAB_DEFS = [
  ["summary", "Summary"],
  ["prompt", "Prompt"],
  ["response", "Response"],
  ["retrieval", "Retrieval"],
  ["qa", "QA"],
] as const satisfies ReadonlyArray<readonly [TabKey, string]>;

function DrawerHeader({
  selectedId,
  detail,
  interactionSummary,
  closeDrawer,
  closeBtnRef,
}: Readonly<{
  selectedId: string | null;
  detail: PgptLogDetailResponse | null;
  interactionSummary: string;
  closeDrawer: () => void;
  closeBtnRef: RefObject<HTMLButtonElement | null>;
}>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction</div>
        <div id="pgpt-drawer-title" className="text-sm font-semibold text-foreground">
          {detail?.log?.session_id ? detail.log.session_id : selectedId}
        </div>
        <div className="text-xs text-muted-foreground">{interactionSummary}</div>
      </div>

      <div className="flex items-center gap-2">
        {selectedId ? <CopyButton value={selectedId} label="Copy id" ariaLabel="Copy interaction id" /> : null}
        {detail?.log?.session_id ? <CopyButton value={detail.log.session_id} label="Copy session" ariaLabel="Copy session id" /> : null}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={closeDrawer}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function DrawerTabs({
  activeTab,
  setActiveTab,
  responseMode,
  setResponseMode,
}: Readonly<{
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  responseMode: "rendered" | "raw";
  setResponseMode: (mode: "rendered" | "raw") => void;
}>) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
      {TAB_DEFS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setActiveTab(key)}
          className={cn(
            "rounded-md border px-3 py-1 text-xs",
            activeTab === key
              ? "border-border bg-background text-foreground"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}

      {activeTab === "response" ? (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</span>
          <button
            type="button"
            onClick={() => setResponseMode("rendered")}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              responseMode === "rendered"
                ? "border-border bg-background text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
            )}
          >
            Rendered
          </button>
          <button
            type="button"
            onClick={() => setResponseMode("raw")}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              responseMode === "raw"
                ? "border-border bg-background text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground",
            )}
          >
            Raw
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DrawerBody({
  loading,
  error,
  detail,
  activeTab,
  fallbackMetadata,
  detailTextStatus,
  responseMode,
  selectedId,
  qaReturnTo,
}: Readonly<{
  loading: boolean;
  error: string | null;
  detail: PgptLogDetailResponse | null;
  activeTab: TabKey;
  fallbackMetadata: unknown;
  detailTextStatus: ReturnType<typeof getTextStorageBadges> | null;
  responseMode: "rendered" | "raw";
  selectedId: string | null;
  qaReturnTo: string;
}>) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {loading ? <DrawerSkeleton /> : null}

      {!loading && error ? (
        <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">{error}</div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          {activeTab === "summary" ? <SummaryTab detail={detail} fallbackMetadata={fallbackMetadata} /> : null}
          {activeTab === "prompt" ? <PromptTab detail={detail} detailTextStatus={detailTextStatus} /> : null}
          {activeTab === "response" ? (
            <ResponseTab detail={detail} detailTextStatus={detailTextStatus} responseMode={responseMode} />
          ) : null}
          {activeTab === "retrieval" ? <RetrievalTab detail={detail} /> : null}
          {activeTab === "qa" ? <QATab detail={detail} selectedId={selectedId} qaReturnTo={qaReturnTo} /> : null}
        </>
      ) : null}
    </div>
  );
}

function LogsDrawer({
  open,
  closeDrawer,
  closeBtnRef,
  drawerRef,
  interactionSummary,
  selectedId,
  detail,
  activeTab,
  setActiveTab,
  responseMode,
  setResponseMode,
  loading,
  error,
  fallbackMetadata,
  detailTextStatus,
  qaReturnTo,
}: Readonly<{
  open: boolean;
  closeDrawer: () => void;
  closeBtnRef: RefObject<HTMLButtonElement | null>;
  drawerRef: RefObject<HTMLDivElement | null>;
  interactionSummary: string;
  selectedId: string | null;
  detail: PgptLogDetailResponse | null;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  responseMode: "rendered" | "raw";
  setResponseMode: (mode: "rendered" | "raw") => void;
  loading: boolean;
  error: string | null;
  fallbackMetadata: unknown;
  detailTextStatus: ReturnType<typeof getTextStorageBadges> | null;
  qaReturnTo: string;
}>) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={closeDrawer} initialFocus={closeBtnRef}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-y-0 right-0 flex w-full max-w-[760px] flex-col outline-none">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel ref={drawerRef} className="flex h-full flex-col border-l border-border bg-card shadow-2xl outline-none">
              <DrawerHeader
                selectedId={selectedId}
                detail={detail}
                interactionSummary={interactionSummary}
                closeDrawer={closeDrawer}
                closeBtnRef={closeBtnRef}
              />

              <DrawerTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                responseMode={responseMode}
                setResponseMode={setResponseMode}
              />

              <DrawerBody
                loading={loading}
                error={error}
                detail={detail}
                activeTab={activeTab}
                fallbackMetadata={fallbackMetadata}
                detailTextStatus={detailTextStatus}
                responseMode={responseMode}
                selectedId={selectedId}
                qaReturnTo={qaReturnTo}
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

type LogsTableWithDrawerProps = Readonly<{
  logs: ReadonlyArray<PerazziLogPreviewRow>;
  tableDensityClass: string;
  truncPrimary: number;
}>;

export function LogsTableWithDrawer({ logs, tableDensityClass, truncPrimary }: LogsTableWithDrawerProps) {
  const cacheRef = useRef(new Map<string, PgptLogDetailResponse>());

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [responseMode, setResponseMode] = useState<"rendered" | "raw">("rendered");

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const selectedPreview = useMemo(() => {
    if (!selectedId) return null;
    return logs.find((l) => l.id === selectedId) ?? null;
  }, [logs, selectedId]);

  const fallbackMetadata = selectedPreview?.metadata;

  const { detail, loading, error } = useLogDetail({ open, selectedId, cacheRef });

  const qaReturnTo = useQaReturnTo(open);

  const detailTextStatus = useDetailTextStatus(detail, fallbackMetadata);

  const interactionSummary = useInteractionSummary(detail, selectedPreview);

  function closeDrawer() {
    setOpen(false);
  }

  function openDrawer(id: string) {
    setSelectedId(id);
    setActiveTab("summary");
    setResponseMode("rendered");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const win = getWindowOrNull();
    if (!win) return;

    const t = win.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    return () => {
      win.clearTimeout(t);
      lastFocusRef.current?.focus?.();
    };
  }, [open]);

  return (
    <>
      <LogsTable logs={logs} tableDensityClass={tableDensityClass} truncPrimary={truncPrimary} onInspect={openDrawer} />
      <LogsDrawer
        open={open}
        closeDrawer={closeDrawer}
        closeBtnRef={closeBtnRef}
        drawerRef={drawerRef}
        interactionSummary={interactionSummary}
        selectedId={selectedId}
        detail={detail}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        responseMode={responseMode}
        setResponseMode={setResponseMode}
        loading={loading}
        error={error}
        fallbackMetadata={fallbackMetadata}
        detailTextStatus={detailTextStatus}
        qaReturnTo={qaReturnTo}
      />
    </>
  );
}
