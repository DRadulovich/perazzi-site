"use client";

import { cn } from "@/lib/utils";

type DualPoint = {
  label: string;
  bar: number;
  line: number | null;
};

type DualAxisChartProps = {
  data: DualPoint[];
  barLabel: string;
  lineLabel: string;
  className?: string;
  height?: number;
};

function formatTick(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

export function DualAxisChart({
  data,
  barLabel,
  lineLabel,
  className,
  height = 240,
}: DualAxisChartProps) {
  const width = 900;
  const padX = 48;
  const padY = 28;
  const bars = data.map((d) => d.bar);
  const lines = data.map((d) => d.line).filter((d): d is number => d !== null && Number.isFinite(d));

  const maxBar = Math.max(...bars, 1);
  const maxLine = Math.max(...lines, 1);
  const step = data.length <= 1 ? 0 : (width - padX * 2) / (data.length - 1 || 1);
  const barWidth = Math.min(28, step * 0.6 || 20);

  const barRects = data.map((d, idx) => {
    const x = padX + idx * step - barWidth / 2;
    const h = (d.bar / maxBar) * (height - padY * 2);
    const y = height - padY - h;
    return { x, y, h };
  });

  const linePath = data.reduce((acc, d, idx) => {
    if (d.line === null || !Number.isFinite(d.line)) return acc;
    const x = padX + idx * step;
    const y = height - padY - (d.line / maxLine) * (height - padY * 2);
    return acc === "" ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }, "");

  const ticks = 4;
  const yTicks = Array.from({ length: ticks }, (_, i) => i / (ticks - 1));

  if (!data.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground", className)}>
        No data available for this range.
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-foreground/40" aria-hidden="true" />
            {barLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-blue-500/70" aria-hidden="true" />
            {lineLabel}
          </span>
        </div>
        <div className="text-[11px]">Last {data.length} days</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-64 w-full" preserveAspectRatio="none">
        {yTicks.map((t, idx) => {
          const y = padY + (1 - t) * (height - padY * 2);
          const opacity = idx === 0 ? 0.15 : 0.08;
          return <line key={t} x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" opacity={opacity} />;
        })}

        {barRects.map((rect, idx) => (
          <rect
            key={idx}
            x={rect.x}
            y={rect.y}
            width={barWidth}
            height={Math.max(2, rect.h)}
            fill="currentColor"
            opacity="0.18"
            rx={3}
          />
        ))}

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="url(#dual-axis-line)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        <defs>
          <linearGradient id="dual-axis-line" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="currentColor" stopOpacity="0.92" offset="0%" />
            <stop stopColor="currentColor" stopOpacity="0.65" offset="100%" />
          </linearGradient>
        </defs>

        {data.map((d, idx) => {
          const x = padX + idx * step;
          const label = d.label;
          const showLabel = data.length <= 14 || idx % Math.ceil(data.length / 14) === 0 || idx === data.length - 1;
          return showLabel ? (
            <text
              key={`${label}-${idx}`}
              x={x}
              y={height - padY + 18}
              fontSize="10"
              fill="currentColor"
              textAnchor="middle"
              opacity="0.65"
            >
              {label}
            </text>
          ) : null;
        })}

        <g aria-hidden>
          {yTicks.map((t, idx) => {
            const y = padY + (1 - t) * (height - padY * 2);
            const val = formatTick(Math.round(maxBar * t));
            return (
              <text
                key={`bar-${idx}`}
                x={padX - 8}
                y={y + 4}
                fontSize="10"
                fill="currentColor"
                textAnchor="end"
                opacity="0.6"
              >
                {val}
              </text>
            );
          })}

          {yTicks.map((t, idx) => {
            const y = padY + (1 - t) * (height - padY * 2);
            const val = Math.round(maxLine * t);
            return (
              <text
                key={`line-${idx}`}
                x={width - padX + 8}
                y={y + 4}
                fontSize="10"
                fill="currentColor"
                textAnchor="start"
                opacity="0.6"
              >
                {val} ms
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
