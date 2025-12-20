"use client";

import { useEffect, useState } from "react";

type AlertEvent = {
  at: string;
  message: string;
  curr?: number | null;
  ref?: number | null;
};

type StreamStatus = "connecting" | "open" | "closed";

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AlertStream() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("connecting");

  useEffect(() => {
    const source = new EventSource("/api/admin/pgpt-insights/alerts");

    source.onopen = () => setStatus("open");
    source.onerror = () => setStatus("closed");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== "alert") return;
        const next: AlertEvent = {
          at: payload.at ?? new Date().toISOString(),
          message: payload.payload?.message ?? "Alert received",
          curr: payload.payload?.curr ?? null,
          ref: payload.payload?.ref ?? null,
        };
        setEvents((prev) => [next, ...prev].slice(0, 12));
      } catch (error) {
        console.error("[alert-stream] failed to parse payload", error);
      }
    };

    return () => {
      source.close();
    };
  }, []);

  const tone =
    status === "open" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-red-500";
  const statusLabel = status === "open" ? "Connected" : status === "connecting" ? "Connecting" : "Disconnected";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Alert Stream</div>
          <div className="text-[11px] text-muted-foreground">LISTEN postgres channel `archetype_alert`</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px]">
          <span className={`h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden="true" />
          <span className="font-medium text-foreground">{statusLabel}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">Waiting for alerts...</p>
      ) : (
        <div className="mt-3 space-y-2">
          {events.map((evt, idx) => (
            <div
              key={`${evt.at}-${idx}`}
              className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{evt.message}</span>
                <span className="text-[11px] text-muted-foreground">{formatTime(evt.at)}</span>
              </div>
              {(evt.curr !== undefined || evt.ref !== undefined) && (
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {evt.curr !== undefined && evt.curr !== null ? <span>curr: {(evt.curr * 100).toFixed(1)}%</span> : null}
                  {evt.ref !== undefined && evt.ref !== null ? <span>ref: {(evt.ref * 100).toFixed(1)}%</span> : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
