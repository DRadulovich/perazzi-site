"use client";

import { useEffect, useState, type ReactNode } from "react";

type AlertEvent = {
  at: string | number;
  message: string;
  curr?: number | null;
  ref?: number | null;
};

type AlertPayload = {
  message?: string;
  curr?: number | null;
  ref?: number | null;
};

type StreamStatus = "connecting" | "open" | "reconnecting" | "closed";

const MAX_EVENTS = 12;

function hasOwn(payload: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

function toFiniteNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeTimestamp(value: unknown): AlertEvent["at"] {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return Date.now();
}

function normalizeAlertPayload(value: unknown): AlertPayload {
  if (value == null) return {};
  if (typeof value === "string") return { message: value };
  if (typeof value !== "object") return {};

  const payload = value as Record<string, unknown>;
  const message = typeof payload.message === "string" && payload.message.trim() !== "" ? payload.message : undefined;

  return {
    message,
    curr: hasOwn(payload, "curr") ? toFiniteNumberOrNull(payload.curr) : undefined,
    ref: hasOwn(payload, "ref") ? toFiniteNumberOrNull(payload.ref) : undefined,
  };
}

function parseAlertEvent(data: string): AlertEvent | null {
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch (error) {
    console.error("[alert-stream] failed to parse payload", error);
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.type !== "alert") return null;

  const alert = normalizeAlertPayload(record.payload);

  return {
    at: normalizeTimestamp(record.at),
    message: alert.message ?? "Alert received",
    curr: alert.curr,
    ref: alert.ref,
  };
}

function buildAlertDetails(evt: AlertEvent): ReactNode[] {
  const details: ReactNode[] = [];
  if (evt.curr !== undefined) {
    details.push(<span key="curr">curr: {formatPct(evt.curr)}</span>);
  }
  if (evt.ref !== undefined) {
    details.push(<span key="ref">ref: {formatPct(evt.ref)}</span>);
  }
  return details;
}

function formatTime(value: AlertEvent["at"]) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatPct(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
}

const STATUS_CONFIG: Record<StreamStatus, { tone: string; label: string }> = {
  open: { tone: "bg-emerald-500", label: "Connected" },
  reconnecting: { tone: "bg-amber-500", label: "Reconnecting" },
  connecting: { tone: "bg-amber-500", label: "Connecting" },
  closed: { tone: "bg-red-500", label: "Disconnected" },
};

export function AlertStream() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/admin/pgpt-insights/alerts");

    // Connection successfully (re)established
    source.onopen = () => {
      setStatus("open");
      setErrorMsg(null);
    };

    // onerror fires for transient issues; EventSource keeps trying.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setStatus("closed");
        setErrorMsg(
          "Real-time alerts offline. Ensure LISTEN privilege on channel archetype_alert and verify DATABASE_URL."
        );
      } else {
        setStatus("reconnecting");
        setErrorMsg(null);
      }
    };

    source.onmessage = (event) => {
      const next = parseAlertEvent(event.data);
      if (!next) return;
      setEvents((prev) => [next, ...prev].slice(0, MAX_EVENTS));
    };

    return () => {
      source.close();
    };
  }, []);

  const { tone, label: statusLabel } = STATUS_CONFIG[status];

  let streamContent: ReactNode;
  if (errorMsg) {
    streamContent = (
      <p className="mt-4 rounded-md border border-red-300/60 bg-red-50 p-3 text-xs text-red-700">{errorMsg}</p>
    );
  } else if (events.length === 0) {
    streamContent = <p className="mt-4 text-xs text-muted-foreground">Waiting for alerts...</p>;
  } else {
    streamContent = (
      <div className="mt-3 space-y-2">
        {events.map((evt, idx) => {
          const details = buildAlertDetails(evt);

          return (
            <div
              key={`${evt.at}-${idx}`}
              className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{evt.message}</span>
                <span className="text-[11px] text-muted-foreground">{formatTime(evt.at)}</span>
              </div>
              {details.length > 0 && (
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">{details}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

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

      {streamContent}
    </div>
  );
}
