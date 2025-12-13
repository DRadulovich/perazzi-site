import { UI_TIMEZONE } from "../../lib/pgpt-insights/constants";

const TS_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: UI_TIMEZONE,
  month: "short",
  day: "2-digit",
});

const TS_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: UI_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

export function formatRate(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCompactNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(value));
}

export function formatDurationMs(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function formatTimestampShort(value: string): string {
  const raw = String(value ?? "");
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw;
  return `${TS_DATE.format(d)} · ${TS_TIME.format(d)}`;
}

export function formatDeltaPct(delta: number): string {
  const arrow = delta >= 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(delta * 100).toFixed(0)}%`;
}

export function formatDeltaMs(deltaMs: number): string {
  const arrow = deltaMs >= 0 ? "↑" : "↓";
  const abs = Math.abs(deltaMs);
  return `${arrow} ${Math.round(abs)}ms`;
}

export function formatDeltaPp(deltaPp: number): string {
  const arrow = deltaPp >= 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(deltaPp).toFixed(1)}pp`;
}
